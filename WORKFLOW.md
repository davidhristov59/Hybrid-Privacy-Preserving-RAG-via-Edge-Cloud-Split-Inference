# Complete Workflow (Step-by-Step)

Your system operates in two main cycles: **Preparation** and **Querying**.

## A. Preparation Phase (Offline Indexing)

1. **Loading:** The system takes the PDF reports and CSV tables (structured and unstructured data)

2. **Scanning (NER):** A local model (on our computer) finds all sensitive data.

3. **Masking:**
   - If it finds "Marko Markovski", it saves it to the Identity Vault and replaces it in the text with `Person_A`.
   - If a CSV table has a column with social security numbers, those values are replaced with codes like `ID_001`.

4. **Storage:** The masked (safe) documents are converted into vectors and sent to the Vector Database (in the cloud). The original data remains only with you.

## B. Query Phase (Real-time Inference)

1. **User Query:** "What are the laboratory results for Marko Markovski?"

2. **Local Anonymization:** The system checks the query, finds "Marko Markovski", looks in the Identity Vault, and converts the query to: "What are the laboratory results for Person_A?"

3. **Search (Cloud Retrieval):** This anonymous query goes to the cloud. The cloud finds documents where `Person_A` is mentioned in the PDF and a results table where `Person_A` appears.

4. **Response Generation:** The Cloud LLM (e.g., GPT-4) composes a response: "The results for Person_A show that blood sugar is within normal range."

5. **Reconstruction (Edge Recovery):** The response returns to your computer. Your system recognizes the `Person_A` code, searches for it in the HashMap, and returns the original name.

6. **Final Result:** The user sees the response: "The results for Marko Markovski show that blood sugar is within normal range."

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PREPARATION PHASE                         │
└─────────────────────────────────────────────────────────────┘

 [Raw Documents]           [Edge - Local Environment]
 ├── medical.pdf     ──►   ┌──────────────────────────┐
 └── labs.csv              │  NER Model (Spacy)       │
                           │  Detects: "Marko"        │
                           └──────────┬───────────────┘
                                      │
                                      ▼
                           ┌──────────────────────────┐
                           │  Identity Vault          │
                           │  {"Marko": "Person_A"}   │
                           └──────────┬───────────────┘
                                      │
                           [Masked Documents]
                           ├── medical_masked.pdf
                           └── labs_masked.csv
                                      │
                                      ▼
                           ┌──────────────────────────┐
                           │  Embeddings Engine       │
                           └──────────┬───────────────┘
                                      │
                                      ▼
                               [Cloud VectorDB]
                               Stores: Person_A data


┌─────────────────────────────────────────────────────────────┐
│                      QUERY PHASE                             │
└─────────────────────────────────────────────────────────────┘

 [User Question]
 "What are Marko's lab results?"
          │
          ▼
 ┌──────────────────────────┐
 │  Edge - Query Masker     │
 │  Vault lookup: Marko → A │
 └──────────┬───────────────┘
            │
            ▼
 "What are Person_A's lab results?"
            │
            ▼
 ┌──────────────────────────┐
 │  Cloud - Vector Search   │
 │  Finds: Person_A docs    │
 └──────────┬───────────────┘
            │
            ▼
 ┌──────────────────────────┐
 │  Cloud LLM (GPT-4)       │
 │  "Person_A: Normal"      │
 └──────────┬───────────────┘
            │
            ▼
 ┌──────────────────────────┐
 │  Edge - Reconstructor    │
 │  Person_A → Marko        │
 └──────────┬───────────────┘
            │
            ▼
 [Final Response to User]
 "Marko's results: Normal blood sugar"
```

---

## Data Flow Security Model

```
LOCAL (EDGE)                          CLOUD
─────────────                         ─────

┌─────────────────┐
│ Original Data   │
│ • Marko         │
│ • SSN: 123-45   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Identity Vault  │
│ (Never shared)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Masked Data     │──────────────►   ┌──────────────┐
│ • Person_A      │                  │ Vector DB    │
│ • ID_001        │                  └──────┬───────┘
└─────────────────┘                         │
                                            ▼
         ▲                          ┌──────────────┐
         │                          │ LLM Response │
         │                          │ (Masked)     │
         │                          └──────┬───────┘
         │                                 │
┌─────────────────┐                        │
│ Reconstructor   │◄───────────────────────┘
│ (Unmasks)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User sees:      │
│ Real Names      │
└─────────────────┘
```

---

## Key Security Principles

1. **PII Never Leaves Edge:** Original identities stay on your local machine
2. **Deterministic Mapping:** Same person = Same token across all documents
3. **Bidirectional Flow:** Mask on the way out, unmask on the way back
4. **Zero-Knowledge Cloud:** Cloud LLM has no access to true identities
