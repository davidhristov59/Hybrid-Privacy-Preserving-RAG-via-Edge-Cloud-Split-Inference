# Hybrid Privacy-Preserving RAG via Edge-Cloud Split Inference

## Project Overview

This project implements a secure **Retrieval-Augmented Generation (RAG)** framework designed to allow complex reasoning over sensitive data without compromising privacy. Utilizing a **Hybrid approach**, it processes both **structured (CSV)** and **unstructured (PDF)** data simultaneously. The core innovation is the **Edge-Cloud Split Inference** architecture combined with a local **Identity Vault (PMR-KB)**, ensuring that Personally Identifiable Information (PII) never leaves the local environment.

## Key Features

- **Deterministic Masking:** Local `Identity Vault` (HashMap) replaces sensitive entities with unique tokens (e.g., `Patient_A`), preserving semantic relationships.
- **Edge-Cloud Split Inference:** Anonymization and reconstruction occur at the **Edge**; the **Cloud** processes only masked tokens.
- **Hybrid Knowledge Synthesis:** Links facts across different data formats (e.g., PDF medical history + CSV lab results).
- **Zero-Trust Security:** Prevents Embedding Inversion Attacks; raw sensitive text is never converted to cloud-stored vectors.
- **Evaluation Framework:** Built-in metrics for Generation Quality (ROUGE, BLEU, METEOR) and Privacy Preservation (PPS, Reconstruction Accuracy).

## Technical Stack

- **Backend:** Python 3.9+, FastAPI
- **Frontend:** React, Vite, Tailwind CSS
- **NER:** Spacy (`en_core_web_sm`)
- **Orchestration:** LangChain
- **Vector Storage:** FAISS / Pinecone
- **LLM Interface:** OpenAI / Gemini (Cloud-side)

## Project Structure

```bash
├── app.py                   # FastAPI Backend Server (Entry point for UI)
├── main.py                  # CLI Orchestrator (Offline Preparation/Scrubbing)
├── models.py                # Pydantic models for API
├── scripts/                 # Utility scripts (Evaluation, etc.)
│   └── evaluate.py          # ROUGE/BLEU/METEOR & Privacy metrics
├── data/
│   ├── raw/                 # Original CSVs and PDFs (Local)
│   └── processed/           # Masked/Anonymized data (Cloud-ready)
├── edge/                    # Local environment (The "Safe Zone")
│   ├── vault/               # Local Identity Vault (PMR-KB)
│   ├── scrubbers/           # NER maskers for PDF/CSV
│   └── reconstructor.py     # De-anonymization logic
├── cloud/                   # Simulated Cloud environment
│   ├── vector_db/           # Vector store for masked embeddings
│   └── llm_interface.py     # Cloud LLM Integration
├── frontend/                # React Dashboard (Vite + Tailwind)
└── requirements.txt         # Python dependencies
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js & npm (for Frontend)

### 1. Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/davidhristov59/Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
    cd Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
    ```

2.  **Create and activate virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    python -m spacy download en_core_web_sm
    ```

4.  **Start the Backend:**
    ```bash
    python app.py
    ```
    *The API will run at `http://localhost:8000`.*

### 2. Frontend Setup

1.  **Navigate to frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    *The UI will run at `http://localhost:5173`.*

## Usage Workflow

### 1. Document Ingestion (Preparation Phase)
You can upload documents via the Web UI ("Knowledge Base" page) or process them offline using the CLI:

```bash
# Offline processing of all files in data/raw/
python main.py --phase prep
```
*This masks sensitive data and saves anonymized versions to `data/processed/`.*

### 2. Secure Chat (Query Phase)
Use the "Chat" page in the Web UI.
1.  **User Query:** "What are Marko's lab results?"
2.  **Edge Masking:** Converts to "What are Person_A's lab results?"
3.  **Cloud Retrieval:** Fetches masked context.
4.  **Cloud Generation:** LLM generates masked response.
5.  **Edge Reconstruction:** Restores "Marko" from `Person_A`.

### 3. Evaluation
Use the "Evaluation" page in the Web UI to test the system's performance.
*   **Generation Metrics:** ROUGE, BLEU, METEOR.
*   **Privacy Metrics:** Privacy Preservation Score (PPS) & Reconstruction Accuracy.

## License Information

This project is licensed under the **MIT License**.
Copyright (c) 2026 David Hristov.
See the `LICENSE` file for details.
