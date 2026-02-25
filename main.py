
import os
import argparse
from dotenv import load_dotenv
from edge.scrubbers.pdf_scrubber import TextScrubber
from edge.scrubbers.csv_scrubber import CSVScrubber

load_dotenv()

def run_preparation_phase():
    """
    Executes the Preparation Phase:
    1. Scans data/raw for PDF and CSV files.
    2. Masks PII using local scrubbers.
    3. Saves anonymized versions to data/processed.
    """
    print(" Starting Preparation Phase (Privacy Scrubbing)...")
    
    # Paths
    raw_dir = os.path.abspath("data/raw")
    processed_dir = os.path.abspath("data/processed")
    os.makedirs(processed_dir, exist_ok=True)
    
    # Initialize Scrubbers
    pdf_scrubber = TextScrubber()
    csv_scrubber = CSVScrubber() # Use auto-inference
    
    # Process Files
    files_processed = 0
    
    for root, _, files in os.walk(raw_dir):
        for file in files:
            file_path = os.path.join(root, file)
            filename = os.path.basename(file_path)
            
            # Save all processed files to the root of processed_dir for easier indexing
            if file.lower().endswith(".pdf"):
                output_path = os.path.join(processed_dir, filename.replace(".pdf", "_masked.md"))
                pdf_scrubber.process_pdf(file_path, output_path)
                files_processed += 1
                
            elif file.lower().endswith(".csv"):
                output_path = os.path.join(processed_dir, filename.replace(".csv", "_masked.md"))
                csv_scrubber.scrub_file(file_path, output_path)
                files_processed += 1
                
    if files_processed == 0:
        print("⚠ No suitable files found in data/raw to process.")
    else:
        print(f" Preparation Phase Complete! Processed {files_processed} files.")
        print(f" Check {processed_dir} for anonymized data.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hybrid Privacy RAG Orchestrator")
    parser.add_argument("--phase", choices=["prep", "query"], default="prep", help="Phase to run: 'prep' for ingestion/scrubbing, 'query' for inference.")
    
    args = parser.parse_args()
    
    if args.phase == "prep":
        run_preparation_phase()
    elif args.phase == "query":
        print(" Query Phase not fully implemented yet.")
