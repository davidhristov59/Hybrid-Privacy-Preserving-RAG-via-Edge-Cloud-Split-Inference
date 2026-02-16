
import argparse
import json
import math
import os
import sys

# Try imports
from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from nltk.translate.meteor_score import meteor_score
import nltk

# Ensure NLTK data
try:
    nltk.data.find('corpora/wordnet.zip')
except LookupError:
    print("📥 Downloading NLTK wordnet...")
    nltk.download('wordnet')
    nltk.download('omw-1.4')
    nltk.download('punkt')
    nltk.download('punkt_tab') # Needed for newer NLTK

class Evaluator:
    def __init__(self):
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        self.chencherry = SmoothingFunction()    


    def calculate_rouge(self, prediction, reference):
        """Calculates ROUGE-1, ROUGE-2, ROUGE-L."""
        scores = self.rouge_scorer.score(reference, prediction)
        return {
            "rouge1": scores["rouge1"].fmeasure,
            "rouge2": scores["rouge2"].fmeasure,
            "rougeL": scores["rougeL"].fmeasure
        }

    def calculate_bleu(self, prediction, reference):
        """Calculates BLEU-4."""
        # NLTK expects tokenized lists
        ref_tokens = nltk.word_tokenize(reference.lower())
        pred_tokens = nltk.word_tokenize(prediction.lower())
        
        # Calculate BLEU-4
        score = sentence_bleu([ref_tokens], pred_tokens, smoothing_function=self.chencherry.method1)
        return score

    def calculate_meteor(self, prediction, reference):
        """Calculates METEOR score."""
        ref_tokens = nltk.word_tokenize(reference.lower())
        pred_tokens = nltk.word_tokenize(prediction.lower())
        score = meteor_score([ref_tokens], pred_tokens)
        return score

    def calculate_privacy_metrics(self, masked_text, final_text, identity_map):
        """
        Calculates privacy and reconstruction metrics.
        
        Args:
            masked_text (str): The text sent to the cloud (should contain placeholders).
            final_text (str): The text returned to the user (should contain real names).
            identity_map (dict): Mapping { "Real Name": "Placeholder" }
            
        Returns:
            dict: { "PPS": float, "Reconstruction_Acc": float }
        """
        if not identity_map:
            return {"PPS": 1.0, "Reconstruction_Acc": 1.0}

        # 1. Privacy Preservation Score (PPS)
        # Goal: No "Real Name" should appear in 'masked_text'
        sensitive_entities = identity_map.keys()
        # We check simply if the sensitive string exists in the masked text
        leaked = sum(1 for entity in sensitive_entities if entity in masked_text)
        pps = 1.0 - (leaked / len(sensitive_entities)) if sensitive_entities else 1.0

        # 2. Reconstruction Accuracy (RA)
        # Goal: No "Placeholder" should appear in 'final_text' (assuming perfect restoration)
        # This metric assumes that if a placeholder remains, reconstruction failed.
        placeholders = identity_map.values()
        failed_unmasking = sum(1 for p in placeholders if p in final_text)
        rec_acc = 1.0 - (failed_unmasking / len(placeholders)) if placeholders else 1.0
        
        return {
            "PPS": round(pps, 4),
            "Reconstruction_Acc": round(rec_acc, 4)
        }

    def evaluate(self, prediction, reference, masked_context=None, identity_map=None):
        print(f"\n🔍 Evaluating...\nGenerated: {prediction[:100]}...\nReference: {reference[:100]}...")
        
        # 1. ROUGE
        rouge = self.calculate_rouge(prediction, reference)
        
        # 2. BLEU
        bleu = self.calculate_bleu(prediction, reference)
        
        # 3. METEOR
        meteor = self.calculate_meteor(prediction, reference)

        results = {
            "ROUGE-1": round(rouge["rouge1"], 4),
            "ROUGE-2": round(rouge["rouge2"], 4),
            "ROUGE-L": round(rouge["rougeL"], 4),
            "BLEU-4": round(bleu, 4),
            "METEOR": round(meteor, 4),
        }

        # 4. Privacy Metrics (Optional)
        if masked_context and identity_map:
            privacy_scores = self.calculate_privacy_metrics(masked_context, prediction, identity_map)
            results.update(privacy_scores)

        return results

if __name__ == "__main__":
    # Example Usage
    evaluator = Evaluator()

    # --- Sample Data (Medical Context) ---
    reference_text = "The patient, Marko Markovski, was diagnosed with Type 2 Diabetes and prescribed Metformin 500mg."
    
    # 1. What the Cloud saw (Masked)
    masked_text_cloud = "The patient, Person_A, was diagnosed with Type 2 Diabetes and prescribed Metformin 500mg."
    
    # 2. What the User receives (Reconstructed - Final Output)
    generated_text = "Marko Markovski has been diagnosed with Type 2 Diabetes. The doctor prescribed Metformin 500mg daily."

    # 3. Simulation of a leak or failure (Uncomment to test)
    # masked_text_cloud = "The patient, Marko Markovski, was diagnosed..." # PPS should drop
    # generated_text = "Person_A has been diagnosed..." # Reconstruction Acc should drop

    # Identity Map (The Vault)
    vault_map = {
        "Marko Markovski": "Person_A",
        "Type 2 Diabetes": "Condition_X" # Example where condition was also masked
    }

    # Run Eval
    results = evaluator.evaluate(
        prediction=generated_text, 
        reference=reference_text, 
        masked_context=masked_text_cloud,
        identity_map=vault_map
    )
    
    print("\n📊 Evaluation Results:")
    print(json.dumps(results, indent=2))
    
    print("\n---------------------------------------------------")
    print("To use this script with your own data:")
    print("python scripts/evaluate.py --file results.json")
