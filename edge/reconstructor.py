import re
import os
import sys

# Add parent directory to path to import vault
# project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
# sys.path.insert(0, project_root)

from edge.vault.mapping_db import IdentityVault

class Reconstructor:
    def __init__(self):
        self.vault = IdentityVault()
        # Regex to find tokens like Person_1, Org_25, Entity_3
        self.token_pattern = re.compile(r'\b(Person|Org|Location|Date|Entity|ID)_(\d+)\b')

    def unmask_text(self, text):
        """
        Replaces anonymized tokens in the text with their original values.
        """
        if not text:
            return ""

        def replace_match(match):
            token = match.group(0)
            return self.vault.get_original(token)

        # Replace all occurrences of the token pattern
        return self.token_pattern.sub(replace_match, text)

# Test execution
if __name__ == "__main__":
    rec = Reconstructor()
    test_str = "Person_6 has an appointment at Org_5."
    print(f"Masked: {test_str}")
    print(f"Unmasked: {rec.unmask_text(test_str)}")