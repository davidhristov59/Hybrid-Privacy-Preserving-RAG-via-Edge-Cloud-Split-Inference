
import json
import requests
import sys
import os

# Add project root to sys.path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.evaluate import Evaluator

API_URL = "http://localhost:8000/chat"
TEST_DATA_PATH = "data/test_data_llm.json"
RESULTS_PATH = "data/test_results.json"

def run_tests():
    print(f"🚀 Starting Test Suite...")
    
    # 1. Load Test Data
    try:
        with open(TEST_DATA_PATH, 'r') as f:
            test_cases = json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Test data file not found at {TEST_DATA_PATH}")
        return

    evaluator = Evaluator()
    results = []

    print(f"📝 Found {len(test_cases)} test cases.")

    for i, case in enumerate(test_cases):
        print(f"\n--- Test Case {i+1}/{len(test_cases)}: {case['id']} ({case['type']}) ---")
        print(f"❓ Question: {case['question']}")
        
        # 2. Send Request to API
        try:
            payload = {"message": case["question"], "history": []}
            response = requests.post(API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            generated_answer = data.get("response", "")
            masked_context = data.get("context", "") # The masked query
            
            print(f"🤖 Answer:   {generated_answer}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API Error: {e}")
            generated_answer = "ERROR"
            masked_context = ""

        # Load Vault for PPS
        try:
            with open("edge/vault/identity_vault.json", "r") as f:
                vault_data = json.load(f)
                vault_map = vault_data.get("forward", {})
        except Exception:
            vault_map = None

        # 3. Evaluate
        if generated_answer != "ERROR":
            # Simple ROUGE/BLEU/METEOR/BERTScore eval
            metrics = evaluator.evaluate(
                prediction=generated_answer,
                reference=case["expected_answer"],
                masked_context=masked_context,
                identity_map=vault_map
            )
            
            print(f"📊 Metrics: ROUGE-1: {metrics['ROUGE-1']}, BLEU-4: {metrics['BLEU-4']}, BERTScore: {metrics.get('BERTScore', 0.0)}")
            
            result_entry = {
                "id": case["id"],
                "question": case["question"],
                "expected": case["expected_answer"],
                "generated": generated_answer,
                "metrics": metrics,
                "type": case["type"]
            }
            results.append(result_entry)
        else:
             results.append({
                "id": case["id"],
                "question": case["question"],
                "error": "API Call Failed"
            })

    # 4. Save Results
    with open(RESULTS_PATH, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✅ Testing Complete. Results saved to {RESULTS_PATH}")

if __name__ == "__main__":
    run_tests()
