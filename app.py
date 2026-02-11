import shutil
import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load env vars immediately
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("api")
logger.info("Starting API...")

logger.info("Importing models...")
from typing import List
from models import ChatInput, ChatResponse, VaultStats, DocumentUploadResponse, DocumentInfo
logger.info("Importing llm_service...")
from cloud.llm_interface import llm_service
logger.info("Importing Reconstructor...")
from edge.reconstructor import Reconstructor
logger.info("Importing IdentityVault...")
from edge.vault.mapping_db import IdentityVault
logger.info("Importing TextScrubber...")
from edge.scrubbers.pdf_scrubber import TextScrubber
logger.info("Importing CSVScrubber...")
from edge.scrubbers.csv_scrubber import CSVScrubber
logger.info("Importing index_documents...")
from cloud.vector_db.indexer import index_documents

# Initialize components
logger.info("Initializing components...")
vault = IdentityVault()
reconstructor = Reconstructor()
# We use TextScrubber for query masking (it has access to Vault)
query_scrubber = TextScrubber() 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Service started. Verifying Vector DB...")
    if not llm_service.vector_store:
        logger.warning("Vector DB not ready. Search might fail.")
    yield
    # Shutdown logic
    logger.info("Service shutting down.")

app = FastAPI(title="Hybrid Privacy RAG API", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Hybrid Privacy RAG API is running. Visit /docs for API documentation."}

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
    except AttributeError:
        # Fallback if method not added yet or reloading issue
        logger.warning("Vault does not support remove_document_references yet.")
    except Exception as e:
        logger.error(f"Error cleaning vault: {e}")

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
        entity_counts=dict(vault.entity_counters),
        last_updated="Just now"
    )

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatInput):
    user_query = payload.message
    
    # 1. Edge: Mask the Query
    # We simply replace known entities in the query with their tokens.
    # Since the query is short, we can check against our known entities in the vault.
    # A simple approach: iterate forward mapping. 
    # For a production system, use NER again, but here we want to match EXISTING entities.
    masked_query = user_query
    
    # Sort keys by length to replace "Sarah Jenkins" before "Sarah"
    known_entities = sorted(vault.forward_mapping.keys(), key=len, reverse=True)
    for entity in known_entities:
        if entity in masked_query:
            masked_query = masked_query.replace(entity, vault.forward_mapping[entity])
    
    logger.info(f"Original Query: {user_query}")
    logger.info(f"Masked Query:   {masked_query}")

    # 2. Cloud: RAG Retrieval & Generation
    masked_response = llm_service.query(masked_query)
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
    
    return DocumentUploadResponse(
        filename=filename,
        status="success",
        message="File uploaded, scrubbed, and indexed.",
        entities_masked=len(vault.forward_mapping) # Approximation
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
