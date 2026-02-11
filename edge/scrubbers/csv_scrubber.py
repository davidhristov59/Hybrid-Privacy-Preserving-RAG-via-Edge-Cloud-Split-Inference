import csv
import sys
import os
import re
import logging
import glob
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Add parent directory to path to import vault
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

from edge.vault.mapping_db import IdentityVault

# Regex Patterns for automatic column detection
PII_REGEX = {
    "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    "PHONE": re.compile(r'\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b'),
    "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "ID": re.compile(r'\b(MRN|ID|SJ|RC|ER)[-_][A-Z0-9]+\b', re.IGNORECASE)
}

class CSVScrubber:
    def __init__(self, sensitive_columns=None):
        """
        Initializes the CSV scrubber.
        """
        self.sensitive_columns = sensitive_columns if sensitive_columns else []
        self.vault = IdentityVault() # Connect to local vault

    def _infer_sensitive_columns(self, header, sample_rows):
        """
        Analyzes headers and content to auto-detect sensitive columns.
        """
        detected_columns = set()
        
        # 1. Header-based heuristics
        for col in header:
            col_lower = col.lower()
            # Must contain sensitive term AND NOT contain non-sensitive context
            if any(term in col_lower for term in ["name", "ssn", "id", "email", "phone", "address", "city", "birth"]):
                if not any(exclude in col_lower for exclude in ["test", "unit", "result", "type", "category"]):
                    detected_columns.add(col)
        
        # 2. Content-based Regex check
        for row in sample_rows:
            for col, value in row.items():
                if col in detected_columns: continue
                for pii_type, pattern in PII_REGEX.items():
                    if pattern.search(str(value)):
                        logger.info(f"Auto-detected sensitive column '{col}' based on {pii_type} pattern.")
                        detected_columns.add(col)
                        break
                        
        return list(detected_columns)

    def scrub_file(self, input_path, output_path):
        """
        Reads a CSV file, masks sensitive columns, and writes the result to output_path.
        """
        if not os.path.exists(input_path):
            logger.error(f"File not found: {input_path}")
            return

        logger.info(f"Processing CSV: {input_path}")
        
        try:
            with open(input_path, mode='r', newline='', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                fieldnames = reader.fieldnames
                rows = list(reader)
                
                target_columns = self.sensitive_columns
                if not target_columns:
                    target_columns = self._infer_sensitive_columns(fieldnames, rows[:5])
                
                valid_columns = [col for col in target_columns if col in fieldnames]
                
                processed_rows = []
                source_name = os.path.basename(input_path)
                for row in rows:
                    for col in valid_columns:
                        original_value = row.get(col, "")
                        if not original_value: continue
                        entity_type = self._infer_entity_type(col)
                        token = self.vault.get_token(original_value, entity_type, source=source_name)
                        row[col] = token
                    processed_rows.append(row)

            # Write masked data as a Markdown table
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, mode='w', encoding='utf-8') as outfile:
                if fieldnames:
                    outfile.write("| " + " | ".join(fieldnames) + " |\n")
                    outfile.write("| " + " | ".join(["---"] * len(fieldnames)) + " |\n")
                    for row in processed_rows:
                        outfile.write("| " + " | ".join(str(row.get(col, "")) for col in fieldnames) + " |\n")
                
            logger.info(f"Masked Markdown saved to: {output_path}")
            
        except Exception as e:
            logger.error(f"Error processing CSV: {e}")

    def _infer_entity_type(self, column_name):
        """Helper to map column names to Vault entity types."""
        column_name = column_name.lower()
        if "name" in column_name:
            return "PERSON"
        elif "ssn" in column_name or "id" in column_name:
            return "ID"
        elif "email" in column_name:
            return "EMAIL"
        elif "phone" in column_name:
            return "PHONE"
        else:
            return "SENSITIVE"

if __name__ == "__main__":
    # Process all CSVs in the raw directory
    input_dir = os.path.abspath("data/raw/csv")
    output_dir = os.path.abspath("data/processed")
    
    csv_files = glob.glob(os.path.join(input_dir, "*.csv"))
    
    if not csv_files:
        logger.warning(f"No CSV files found in {input_dir}")
        sys.exit(0)

    scrubber = CSVScrubber()
    
    for csv_path in csv_files:
        filename = os.path.basename(csv_path)
        output_filename = os.path.splitext(filename)[0] + "_masked.md"
        output_path = os.path.join(output_dir, output_filename)
        scrubber.scrub_file(csv_path, output_path)
    
    logger.info("Batch CSV processing complete.")
