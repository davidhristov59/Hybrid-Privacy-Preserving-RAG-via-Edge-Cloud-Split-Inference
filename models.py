from pydantic import BaseModel
from typing import List, Optional, Dict

class ChatInput(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    context: Optional[str] = None # Optional: return context used

class VaultStats(BaseModel):
    total_entities: int
    entity_counts: Dict[str, int]
    last_updated: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    filename: str
    status: str
    message: str
    entities_masked: int

class DocumentInfo(BaseModel):
    filename: str
    file_type: str
    size_bytes: int
    path: str
