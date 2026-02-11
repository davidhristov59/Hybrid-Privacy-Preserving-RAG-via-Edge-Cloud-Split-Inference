import spacy
import sys
import os
import re
import logging
import glob
from pypdf import PdfReader
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

# Use the larger model for better accuracy
MODEL_NAME = "en_core_web_lg"

# Regex Patterns for additional PII
PII_REGEX = {
    "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    "PHONE": re.compile(r'\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b'),
    "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    # Simple MRN/ID pattern (e.g., MRN-123456 or ID_999) - customize as needed
    "ID": re.compile(r'\b(MRN|ID)[-_][A-Z0-9]+\b', re.IGNORECASE)
}

class TextScrubber:
    def __init__(self, model_name=MODEL_NAME):
        """
        Initializes the text scrubber with a Spacy model and connects to the Vault.
        """
        self.model_name = model_name
        try:
            logger.info(f"Loading Spacy model: {model_name}...")
            self.nlp = spacy.load(model_name)
            logger.info("Spacy model loaded successfully.")
        except OSError:
            logger.error(f"Spacy model '{model_name}' not found. Please run: python -m spacy download {model_name}")
            self.nlp = None

        self.vault = IdentityVault() # Connects to the local Identity Vault
        self.global_entities = {} # Store discovered entities for global consistency

    def identify_entities(self, text):
        """
        Scans text for PII using both Spacy NER and Regex.
        Returns a list of (text, label) tuples.
        """
        found_entities = []

        # 1. Regex-based detection
        for label, pattern in PII_REGEX.items():
            matches = pattern.findall(text)
            for match in matches:
                # If it's a tuple (from groups), take the first element or join
                if isinstance(match, tuple):
                    match = match[0]
                
                clean_match = match.replace('\n', ' ').strip()
                if clean_match:
                    found_entities.append((clean_match, label))

        # 2. Spacy NER detection
        if self.nlp:
            self.nlp.max_length = len(text) + 10000 
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG", "GPE", "LOC", "DATE"]:
                    # Clean the entity text: if it spans a newline, assume it's an artifact and take the first part
                    clean_text = ent.text
                    if '\n' in clean_text:
                        clean_text = clean_text.split('\n')[0]
                    
                    clean_text = clean_text.strip()
                    
                    # Filter out short noise or obviously bad captures
                    if len(clean_text) > 2:
                        found_entities.append((clean_text, ent.label_))
        
        return found_entities

    def process_pdf(self, pdf_path, output_path=None):
        """
        Reads a PDF, performs global entity resolution, and scrubs the text.
        """
        if not os.path.exists(pdf_path):
            logger.error(f"File not found: {pdf_path}")
            return None
        
        logger.info(f"Processing PDF: {pdf_path}")
        reader = PdfReader(pdf_path)
        full_text = ""
        
        # Step 1: Extract all text
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        
        if not full_text:
            logger.warning(f"No text extracted from PDF: {pdf_path}")
            return ""

        # Step 2: Global Entity Discovery
        entities = self.identify_entities(full_text)
        
        # Register entities in the Vault and build a replacement map
        unique_entities = sorted(list(set(entities)), key=lambda x: len(x[0]), reverse=True)
        
        replacements = []
        source_name = os.path.basename(pdf_path)
        for text_val, label in unique_entities:
            token = self.vault.get_token(text_val, label, source=source_name)
            replacements.append((text_val, token))

        # Step 3: Global Scrubbing
        scrubbed_text = full_text
        for original, token in replacements:
            scrubbed_text = scrubbed_text.replace(original, token)

        # Step 4: Save Output
        if output_path:
            try:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(scrubbed_text)
                logger.info(f"Masked text saved to: {output_path}")
            except Exception as e:
                logger.error(f"Failed to write output file: {e}")
            
        return scrubbed_text

if __name__ == "__main__":
    # Process all PDFs in the raw directory
    input_dir = os.path.abspath("data/raw/pdf")
    output_dir = os.path.abspath("data/processed")
    
    pdf_files = glob.glob(os.path.join(input_dir, "*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {input_dir}")
        sys.exit(0)

    scrubber = TextScrubber()
    
    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        output_filename = os.path.splitext(filename)[0] + "_masked.md"
        output_path = os.path.join(output_dir, output_filename)
        scrubber.process_pdf(pdf_path, output_path)
    
    logger.info("Batch PDF processing complete.")
