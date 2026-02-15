# 🚀 How to Run the Project (Execution Order)

This guide explains the step-by-step execution order for your Hybrid Privacy-Preserving RAG system.

---

## 1️⃣ Setup (One-Time Only)

Before running any scripts, ensure your environment is ready.

```bash
# 1. Activate your virtual environment
source .venv/bin/activate

# 2. Install dependencies (updated with pypdf)
pip install -r requirements.txt

# 3. Download the Spacy NER model
python -m spacy download en_core_web_sm
```

---

## 2️⃣ Phase 1: Preparation (Data Scrubbing)

This operates on your **local machine (Edge)** to secure your data.

1.  **Place Data:** Put your raw PDF and CSV files into the `data/raw/` directory.
    - Example: `data/raw/patient_records.pdf`
    - Example: `data/raw/lab_results.csv`

2.  **Run the Orchestrator:** This single command scans all files, scrubs PII, and updates your Vault.

    ```bash
    python main.py --phase prep
    ```

    - **What happens?**
      - Anonymized files are saved to `data/processed/`.
      - Your private mappings are saved to `edge/vault/identity_vault.json`.

---

## 3️⃣ Testing Individual Components (Optional)

You can test specific parts of the system independently to verify they work.

### Test the Identity Vault

Verify that names are being mapped correctly.

```bash
python edge/vault/mapping_db.py
```

_(Note: You might need to add a small test block to this file if it doesn't have one)_

### Test PDF Scrubbing

Manually scrub a specific PDF file.

```bash
python edge/scrubbers/pdf_scrubber.py data/raw/your_file.pdf
```

### Test CSV Scrubbing

Manually scrub a CSV file.

```bash
python edge/scrubbers/csv_scrubber.py
```

### Test Reconstruction (De-Anonymization)

Simulate recovering a real name from a masked token.

```bash
python edge/reconstructor.py
```

---

## 4️⃣ Phase 2: Querying (Coming Soon)

_Once implemented, the command will be:_

```bash
python main.py --phase query
```
