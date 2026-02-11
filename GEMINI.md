# Hybrid Privacy-Preserving RAG via Edge-Cloud Split Inference

## Project Overview

This project implements a secure **Retrieval-Augmented Generation (RAG)** framework designed to allow complex reasoning over sensitive data without compromising privacy. Utilizing a **Hybrid approach**, it processes both **structured (CSV)** and **unstructured (PDF)** data simultaneously. The core innovation is the **Edge-Cloud Split Inference** architecture combined with a local **Identity Vault (PMR-KB)**, ensuring that Personally Identifiable Information (PII) never leaves the local environment.

## Key Features

- **Deterministic Masking:** Local `Identity Vault` (HashMap) replaces sensitive entities with unique tokens (e.g., `Patient_A`), preserving semantic relationships.
- **Edge-Cloud Split Inference:** Anonymization and reconstruction occur at the **Edge**; the **Cloud** processes only masked tokens.
- **Hybrid Knowledge Synthesis:** Links facts across different data formats (e.g., PDF medical history + CSV lab results).
- **Zero-Trust Security:** Prevents Embedding Inversion Attacks; raw sensitive text is never converted to cloud-stored vectors.

## Technical Stack

- **Language:** Python 3.9+
- **NER:** Spacy (`en_core_web_sm`)
- **Orchestration:** LangChain / LlamaIndex
- **Vector Storage:** FAISS or Pinecone
- **LLM Interface:** OpenAI / Gemini / Azure (Cloud-side)

## Setup Instructions

### Prerequisites
Ensure you have Python 3.9+ installed.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/davidhristov59/Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
    cd Hybrid-Privacy-Preserving-RAG-via-Edge-Cloud-Split-Inference
    ```

2.  **Create and activate virtual environment:**
    ```bash
    python -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Download Spacy model:**
    ```bash
    python -m spacy download en_core_web_sm
    ```

## Usage Examples

### 1. Preparation Phase (Offline Indexing)
Load, scan, and mask your sensitive documents before cloud upload.

```bash
# Example: Process a PDF file
python edge/scrubbers/pdf_scrubber.py data/raw/pdf/patient_record.pdf

# Example: Process a CSV file
python edge/scrubbers/csv_scrubber.py data/raw/csv/lab_results.csv
```
*Output: Masked files saved to `data/processed/` (e.g., `patient_record_masked.md`).*

### 2. Query Phase (Real-time Inference)
Run the main orchestrator to perform secure RAG queries.

```bash
python main.py
```
*Workflow:*
1.  **User Query:** "What are Marko's lab results?"
2.  **Edge Masking:** Converts to "What are Person_A's lab results?"
3.  **Cloud Retrieval:** Fetches masked context for `Person_A`.
4.  **Cloud Generation:** LLM generates masked response.
5.  **Edge Reconstruction:** Restores "Marko" from `Person_A`.
6.  **Final Output:** "Marko's results: Normal blood sugar"

## Contribution Guidelines

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License Information

This project is licensed under the **MIT License**.
Copyright (c) 2026 David Hristov.
See the `LICENSE` file for details.
