import os
import logging
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableMap
from dotenv import load_dotenv

# Setup logging
logger = logging.getLogger(__name__)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

class LLMService:
    def __init__(self):
        load_dotenv()
        self.vector_db_path = os.path.abspath("cloud/vector_db/faiss_index")
        self.vector_store = None
        self.qa_chain = None
        self.retriever = None
        self._initialize_service()

    def _initialize_service(self):
        """Loads the Vector DB and initializes the LLM chain."""
        if not os.path.exists(self.vector_db_path):
            logger.info(f"Vector DB not found at {self.vector_db_path}. Waiting for documents to be uploaded and indexed.")
            return

        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            logger.info("Using OpenAI Embeddings for retrieval.")
            embeddings = OpenAIEmbeddings(openai_api_key=api_key)
            llm = ChatOpenAI(temperature=0, model_name="gpt-4o", openai_api_key=api_key)
        else:
            logger.warning("No OpenAI Key. Using Local Embeddings (all-MiniLM-L6-v2).")
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            llm = None

        try:
            self.vector_store = FAISS.load_local(
                self.vector_db_path,
                embeddings,
                allow_dangerous_deserialization=True
            )
            logger.info("Vector DB loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Vector DB: {e}")
            return

        if llm and self.vector_store:
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 10})

            prompt_template = """Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Context:
{context}

Question: {question}
Answer:"""

            prompt = PromptTemplate(
                template=prompt_template,
                input_variables=["context", "question"]
            )

            # Modern LCEL chain — replaces RetrievalQA
            self.qa_chain = (
                RunnableMap({
                    "context": lambda x: format_docs(self.retriever.invoke(x["question"])),
                    "question": lambda x: x["question"],
                })
                | prompt
                | llm
                | StrOutputParser()
            )

            logger.info("QA Chain initialized.")

    def query(self, question: str, history: list = []) -> str:
        """Queries the RAG system with conversation history."""
        if not self.qa_chain or not self.retriever:
            return "System is not initialized (Vector DB or LLM missing)."

        history_text = ""
        if history:
            history_text = "Conversation History:\n"
            for msg in history:
                role = "User" if msg["role"] == "user" else "AI"
                history_text += f"{role}: {msg['content']}\n"
            history_text += "\n"

        full_query = f"{history_text}Current Question: {question}"

        logger.info(f"--- CLOUD TRANSMISSION ---")
        logger.info(f"SENT TO LLM: {question}")
        logger.info(f"WITH HISTORY: {len(history)} messages")
        logger.info(f"--------------------------")

        try:
            source_docs = self.retriever.invoke(full_query)
            logger.info(f"Retrieved {len(source_docs)} documents.")
            for i, doc in enumerate(source_docs):
                logger.info(f"Doc {i+1} Source: {doc.metadata.get('source', 'unknown')}")
                logger.info(f"Doc {i+1} Content Preview: {doc.page_content[:200]}...")

            result = self.qa_chain.invoke({"question": full_query})
            return result

        except Exception as e:
            logger.error(f"Error during LLM query: {e}")
            return "An error occurred while processing your request."

# Singleton instance
llm_service = LLMService()