import shutil
import os
import uvicorn
import logging
from typing import List
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import ChatInput, ChatResponse, VaultStats, DocumentUploadResponse, DocumentInfo, EvaluationRequest
from cloud.llm_interface import llm_service
from edge.reconstructor import Reconstructor
from edge.vault.mapping_db import IdentityVault
from edge.scrubbers.pdf_scrubber import TextScrubber
from edge.scrubbers.csv_scrubber import CSVScrubber
from cloud.vector_db.indexer import index_documents

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

load_dotenv()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("api")
logger.info("Starting API...")

# Initialize components
vault = IdentityVault()
reconstructor = Reconstructor()
query_scrubber = TextScrubber()
evaluator = None

def get_evaluator():
    global evaluator
    if evaluator is None:
        try:
            from scripts.evaluate import Evaluator
            evaluator = Evaluator()
        except ImportError:
            logger.error("Could not import Evaluator. Evaluation metrics unavailable.")
    return evaluator




async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Service started. Verifying directories...")
    os.makedirs("data/raw/pdf", exist_ok=True)
    os.makedirs("data/raw/csv", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)

    logger.info("Verifying Vector DB...")
    if not llm_service.vector_store:
        logger.info("Vector DB not ready yet. Upload documents to initialize it.")
    yield
    # Shutdown logic
    logger.info("Service shutting down.")


app = FastAPI(title="Hybrid Privacy RAG API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React default
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Hybrid Privacy RAG API is running. Visit /docs for API documentation."}


@app.post("/evaluate")
def evaluate_query(payload: EvaluationRequest):
    """
    Evaluates a generated answer against a reference answer using ROUGE/BLEU/METEOR.
    Also calculates Privacy Scores if masked_context is provided.
    """
    eval_tool = get_evaluator()
    if not eval_tool:
        raise HTTPException(status_code=503, detail="Evaluator not initialized.")

    # Get vault map for privacy calculations
    vault_map = vault.forward_mapping if vault.forward_mapping else None

    # Run evaluation
    results = eval_tool.evaluate(
        prediction=payload.generated_answer,
        reference=payload.reference_answer,
        masked_context=payload.masked_context,
        identity_map=vault_map
    )
    
    return results


@app.get("/health")
def health_check():
    return {"status": "healthy", "vector_db": llm_service.vector_store is not None}


@app.get("/documents", response_model=List[DocumentInfo])
def list_documents():
    """Lists all raw documents available in the system."""
    docs = []

    # Check PDF directory
    pdf_dir = "data/raw/pdf"
    if os.path.exists(pdf_dir):
        for f in os.listdir(pdf_dir):
            if f.lower().endswith(".pdf"):
                path = os.path.join(pdf_dir, f)
                size = os.path.getsize(path)
                docs.append(DocumentInfo(filename=f, file_type="pdf", size_bytes=size, path=path))

    # Check CSV directory
    csv_dir = "data/raw/csv"
    if os.path.exists(csv_dir):
        for f in os.listdir(csv_dir):
            if f.lower().endswith(".csv"):
                path = os.path.join(csv_dir, f)
                size = os.path.getsize(path)
                docs.append(DocumentInfo(filename=f, file_type="csv", size_bytes=size, path=path))

    return docs


@app.delete("/documents/{filename}")
def delete_document(filename: str):
    """Deletes a document and cleans up its data (masked file, vault entries, index)."""
    ext = filename.split(".")[-1].lower()

    # Determine raw path
    if ext == "pdf":
        raw_path = os.path.join("data/raw/pdf", filename)
    elif ext == "csv":
        raw_path = os.path.join("data/raw/csv", filename)
    else:
        # Try to find it if extension is ambiguous or missing in request (unlikely if strictly named)
        if os.path.exists(os.path.join("data/raw/pdf", filename)):
            raw_path = os.path.join("data/raw/pdf", filename)
        elif os.path.exists(os.path.join("data/raw/csv", filename)):
            raw_path = os.path.join("data/raw/csv", filename)
        else:
            raise HTTPException(status_code=404, detail="File not found")

    # 1. Delete Raw File
    if os.path.exists(raw_path):
        os.remove(raw_path)
        logger.info(f"Deleted raw file: {raw_path}")
    else:
        raise HTTPException(status_code=404, detail="File not found on disk")

    # 2. Delete Processed File
    # Logic from upload: processed_filename = os.path.splitext(filename)[0] + "_masked.md"
    processed_filename = os.path.splitext(filename)[0] + "_masked.md"
    processed_path = os.path.join("data/processed", processed_filename)

    if os.path.exists(processed_path):
        os.remove(processed_path)
        logger.info(f"Deleted processed file: {processed_path}")

    # 3. Clean up Vault
    try:
        vault.remove_document_references(filename)
    except Exception as e:
        logger.error(f"Error cleaning vault: {e}")
        # We continue even if vault cleanup fails, to ensure consistency? 
        # Ideally, we should maybe rollback, but for now we log and proceed to re-indexing.

    # 4. Re-index Vector DB
    try:
        index_documents()
        llm_service._initialize_service()
    except Exception as e:
        logger.error(f"Re-indexing failed: {e}")
        return {"status": "partial_success", "message": "File deleted, but re-indexing failed."}

    return {"status": "success", "message": f"Document {filename} deleted and system updated."}


@app.get("/vault-stats", response_model=VaultStats)
def get_vault_stats():
    # Reload vault to get latest stats
    vault.load_vault()
    total = len(vault.forward_mapping)
    return VaultStats(
        total_entities=total,
        entity_counts=vault.get_live_entity_counts(),
        last_updated="Just now"
    )

@app.get("/vault/graph")
def get_vault_graph():
    """
    Returns graph data (nodes and links) based on the Identity Vault.
    Nodes: Masked Tokens (e.g., Person_A)
    Links: Co-occurrence in the same source document.
    """
    vault.load_vault()
    
    return vault.serialize_for_graph()


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatInput):
    user_query = payload.message
    history = payload.history or []

    # 1. Edge: Mask the Query AND History

    # Helper to mask a string
    def mask_text(text):
        masked = text
        # Sort keys by length to replace "Sarah Jenkins" before "Sarah"
        known_entities = sorted(vault.forward_mapping.keys(), key=len, reverse=True)
        for entity in known_entities:
            if entity in masked:
                masked = masked.replace(entity, vault.forward_mapping[entity])
        return masked

    masked_query = mask_text(user_query)
    
    # Process history: only take the last 10 messages (or fewer) as requested, 
    # though frontend handles the time limit, we handle masking here.
    masked_history = []
    for msg in history:
        masked_msg = mask_text(msg["content"])
        masked_history.append({"role": msg["role"], "content": masked_msg})

    logger.info(f"Original Query: {user_query}")
    logger.info(f"Masked Query:   {masked_query}")
    logger.info(f"History Depth:  {len(masked_history)}")

    # 2. Cloud: RAG Retrieval & Generation with History
    masked_response = llm_service.query(masked_query, history=masked_history)
    logger.info(f"Cloud Response: {masked_response}")

    # 3. Edge: Reconstruct (Unmask)
    final_response = reconstructor.unmask_text(masked_response)

    return ChatResponse(response=final_response, context=masked_query)


@app.post("/upload-document", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename
    ext = filename.split(".")[-1].lower()

    # Determine paths
    if ext == "pdf":
        raw_dir = "data/raw/pdf"
        scrubber = TextScrubber()
    elif ext == "csv":
        raw_dir = "data/raw/csv"
        scrubber = CSVScrubber()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or CSV.")

    os.makedirs(raw_dir, exist_ok=True)
    raw_path = os.path.join(raw_dir, filename)

    # Save File
    try:
        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Scrub File
    try:
        processed_filename = os.path.splitext(filename)[0] + "_masked.md"
        processed_path = os.path.abspath(os.path.join("data/processed", processed_filename))

        if ext == "pdf":
            scrubber.process_pdf(raw_path, processed_path)
        else:
            scrubber.scrub_file(raw_path, processed_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scrubbing failed: {e}")

    # Re-index (Triggering full re-index for simplicity in this prototype)
    # In production, we'd add just this document.
    try:
        index_documents()
        # Reload the service's vector store
        llm_service._initialize_service()
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        # Don't fail the request, just warn

    # Force reload of vault to get fresh stats for response
    vault.load_vault()

    return DocumentUploadResponse(
        filename=filename,
        status="success",
        message="File uploaded, scrubbed, and indexed.",
        entities_masked=len(vault.forward_mapping)
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)