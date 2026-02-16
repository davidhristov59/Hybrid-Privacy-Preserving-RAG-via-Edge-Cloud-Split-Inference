# Hybrid Privacy-Preserving RAG via Edge-Cloud Split Inference

## Overview

This project implements a secure **Retrieval-Augmented Generation (RAG)** framework that allows for complex reasoning over sensitive data without compromising privacy. By combining **Split Inference** architecture with a local **Identity Vault (PMR-KB)**, the system ensures that Personally Identifiable Information (PII) never leaves the local environment.

Unlike traditional RAG systems, this project provides a **Hybrid approach**, processing both **structured (CSV)** and **unstructured (PDF)** data simultaneously.

## Key Features

- **Deterministic Masking:** Uses a local `Identity Vault` (HashMap) to replace sensitive entities with unique tokens (e.g., `Patient_A`, `Company_X`), preserving semantic relationships for the LLM.
- **Edge-Cloud Split Inference:** Anonymization and result reconstruction happen at the **Edge**, while the **Cloud** only sees masked tokens.
- **Hybrid Knowledge Synthesis:** Capability to link facts across different formats (e.g., matching a patient's medical history in a PDF with their lab results in a CSV).
- **Zero-Trust Security:** Prevents **Embedding Inversion Attacks** by ensuring raw sensitive text is never converted into cloud-stored vectors.

## Technical Architecture

Based on the methodology established in **Wei et al. (IEEE, 2025)**:

1. **Pre-processing:** Local NER models identify PII in PDFs and CSVs.
2. **Masking:** PII is replaced with tokens; mappings are stored in a local `mapping_db`.
3. **Retrieval:** Masked queries are sent to the Cloud Vector DB.
4. **Generation:** The Cloud LLM generates a response using masked context.
5. **Reconstruction:** The Edge layer restores the original identities into the final response using the local Vault.

## Getting Started

### Prerequisites

- Python 3.9+
- Spacy (for NER)
- LangChain
- FAISS (for Vector Storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/davidhristov59/Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
   cd Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
   ```

2. Create a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Download Spacy models:
   ```bash
   python -m spacy download en_core_web_lg
   ```

## Running the Application

### 1. Start the Backend (FastAPI)

```bash
python app.py
```

The API will be available at `http://localhost:8000/docs`.

### 2. Start the Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## Project Structure

```bash
├── app.py                   # FastAPI Backend Server
├── main.py                  # CLI Orchestrator (Offline Prep)
├── models.py                # Pydantic models for API
├── data/
│   ├── raw/                 # Original CSVs and PDFs (Local)
│   └── processed/           # Masked/Anonymized data
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
