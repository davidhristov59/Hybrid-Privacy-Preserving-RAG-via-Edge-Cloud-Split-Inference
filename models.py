from pydantic import BaseModel
from typing import List, Optional, Dict

class ChatInput(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    response: str
    context: Optional[str] = None

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

class EvaluationRequest(BaseModel):
    question: str
    generated_answer: str
    reference_answer: str
    masked_context: Optional[str] = None
