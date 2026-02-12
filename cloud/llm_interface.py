import os
import logging
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

# Setup logging
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        load_dotenv()
        self.vector_db_path = os.path.abspath("cloud/vector_db/faiss_index")
        self.vector_store = None
        self.qa_chain = None
        self._initialize_service()

    def _initialize_service(self):
        """Loads the Vector DB and initializes the LLM chain."""
        if not os.path.exists(self.vector_db_path):
            logger.info(f"Vector DB not found at {self.vector_db_path}. Waiting for documents to be uploaded and indexed.")
            return

        # 1. Embeddings
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            logger.info("Using OpenAI Embeddings for retrieval.")
            embeddings = OpenAIEmbeddings(openai_api_key=api_key)
            llm = ChatOpenAI(temperature=0, model_name="gpt-4o", openai_api_key=api_key)
        else:
            logger.warning("No OpenAI Key. Using Local Embeddings (all-MiniLM-L6-v2). Generation will fail if no LLM is configured.")
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            # For a pure local demo without key, we might need a dummy LLM or local LLM here.
            # But the requirement implies OpenAI usage.
            llm = None 

        # 2. Vector Store
        try:
            self.vector_store = FAISS.load_local(
                self.vector_db_path, 
                embeddings, 
                allow_dangerous_deserialization=True # Trusted local source
            )
            logger.info("Vector DB loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Vector DB: {e}")
            return

        # 3. QA Chain
        if llm and self.vector_store:
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 10})
            
            # Custom Prompt for RAG
            prompt_template = """Use the following pieces of context to answer the question at the end. 
            If you don't know the answer, just say that you don't know, don't try to make up an answer.
            
            Context:
            {context}
            
            Question: {question}
            Answer:"""
            
            PROMPT = PromptTemplate(
                template=prompt_template, input_variables=["context", "question"]
            )

            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": PROMPT}
            )
            logger.info("QA Chain initialized.")

    def query(self, question: str) -> str:
        """
        Queries the RAG system.
        """
        if not self.qa_chain:
            return "System is not initialized (Vector DB or LLM missing)."
        
        logger.info(f"--- CLOUD TRANSMISSION ---")
        logger.info(f"SENT TO LLM: {question}")
        logger.info(f"--------------------------")
        
        try:
            # result = self.qa_chain.invoke({"query": question})
            # return result["result"]
            
            # Use verbose running to inspect retrieval
            response = self.qa_chain.invoke({"query": question})
            
            # Log retrieved docs
            source_docs = response.get("source_documents", [])
            logger.info(f"Retrieved {len(source_docs)} documents.")
            for i, doc in enumerate(source_docs):
                logger.info(f"Doc {i+1} Source: {doc.metadata.get('source', 'unknown')}")
                logger.info(f"Doc {i+1} Content Preview: {doc.page_content[:200]}...")
            
            return response["result"]
            
        except Exception as e:
            logger.error(f"Error during LLM query: {e}")
            return "An error occurred while processing your request."

# Singleton instance
llm_service = LLMService()
