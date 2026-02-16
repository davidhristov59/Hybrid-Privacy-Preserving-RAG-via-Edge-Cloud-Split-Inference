import json
import os
from collections import defaultdict
from datetime import datetime

VAULT_PATH = os.getenv("VAULT_PATH", "edge/vault/identity_vault.json")

# Graph serialization performance safeguards
MAX_ENTITIES_PER_SOURCE = int(os.getenv("MAX_ENTITIES_PER_SOURCE", "50"))  # Cap entities per source for link generation
MIN_COOCCURRENCE_THRESHOLD = int(os.getenv("MIN_COOCCURRENCE_THRESHOLD", "1"))  # Minimum shared sources to create a link
MAX_LINKS_PER_NODE = int(os.getenv("MAX_LINKS_PER_NODE", "20"))  # Top-N strongest links per node

class IdentityVault:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(IdentityVault, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, vault_path=VAULT_PATH):
        """
        Initializes the Identity Vault.
        
        Args:
            vault_path (str): Path to the JSON file storing the vault data.
        """
        if self._initialized:
            return
            
        self.vault_path = vault_path or VAULT_PATH
        self.forward_mapping = {}  # "Original Text" -> "Token"
        self.reverse_mapping = {}  # "Token" -> "Original Text"
        self.metadata = {}         # "Token" -> { "sources": [], "type": "", "created": "" }
        self.entity_counters = defaultdict(int)  # "Person" -> 5 (count for unique IDs for each entity type)
        
        # Ensure directory exists
        if self.vault_path:
             os.makedirs(os.path.dirname(self.vault_path), exist_ok=True)
        
        self.load_vault()
        self._initialized = True

    def load_vault(self):
        """Loads the vault mapping from disk if it exists."""
        if self.vault_path and os.path.exists(self.vault_path):
            try:
                with open(self.vault_path, 'r') as f:
                    data = json.load(f)
                    self.forward_mapping = data.get("forward", {})
                    self.reverse_mapping = data.get("reverse", {})
                    self.metadata = data.get("metadata", {})
                    self.entity_counters = defaultdict(int, data.get("counters", {}))
                print(f"Loaded Identity Vault from {self.vault_path}")
            except json.JSONDecodeError:
                print("Vault file corrupted or empty, starting fresh.")
        else:
            print(f"No existing vault found at {self.vault_path}, creating new one.")

    def save_vault(self):
        """Persists the current mappings to disk."""
        if not self.vault_path:
            return

        try:
            with open(self.vault_path, 'w') as f:
                json.dump({
                    "forward": self.forward_mapping,
                    "reverse": self.reverse_mapping,
                    "metadata": self.metadata,
                    "counters": self.entity_counters
                }, f, indent=4)
            # print(f" Vault saved to {self.vault_path}") 
        except Exception as e:
            print(f"Error saving vault: {e}")

    def get_token(self, original_text, entity_type="ENTITY", source=None):
        """
        Gets the anonymized token for a given entity text.
        If the entity already exists in the vault, returns the existing token (deterministic).
        If not, generates a new token and saves it.
        
        Args:
            original_text (str): The sensitive text (e.g., "Marko Markovski").
            entity_type (str): The label from NER (e.g., "PERSON", "ORG").
            source (str, optional): The filename/source where this entity was found.
            
        Returns:
            str: The anonymized token (e.g., "Person_1").
        """
        if not original_text:
            return original_text
            
        original_text = original_text.strip()
        
        # 1. Check if already vaulted
        if original_text in self.forward_mapping:
            token = self.forward_mapping[original_text]
            # Update metadata with new source if available
            if source:
                self._update_metadata(token, source)
            return token
        
        # 2. Create New Entry
        
        # Map Spacy/Generic types to readable prefixes
        prefix = self._map_entity_type_to_prefix(entity_type)
        
        # Increment counter for this type to ensure unique token
        self.entity_counters[prefix] += 1
        new_token = f"{prefix}_{self.entity_counters[prefix]}"
        
        # Store mappings
        self.forward_mapping[original_text] = new_token
        self.reverse_mapping[new_token] = original_text
        
        # Create Metadata
        self.metadata[new_token] = {
            "type": entity_type,
            "created_at": datetime.now().isoformat(),
            "sources": [source] if source else []
        }
        
        # Auto-save on update
        self.save_vault()
        
        return new_token

    def _update_metadata(self, token, source):
        """Updates metadata for an existing token."""
        if token not in self.metadata:
            # Should not happen if data is consistent, but safe to handle
            self.metadata[token] = {
                "type": "UNKNOWN",
                "created_at": datetime.now().isoformat(),
                "sources": []
            }
        
        if source and source not in self.metadata[token]["sources"]:
            self.metadata[token]["sources"].append(source)
            self.save_vault()

    def remove_document_references(self, source_filename):
        """
        Removes all references to a specific document from the vault.
        If an entity is only referenced by this document, the entity is removed entirely.
        
        Args:
            source_filename (str): The name of the file being deleted (e.g. "report.pdf").
        """
        tokens_to_remove = []
        
        # Iterate over a copy of items since we might modify
        for token, meta in self.metadata.items():
            sources = meta.get("sources", [])
            if source_filename in sources:
                sources.remove(source_filename)
                # If no sources remain, mark for deletion
                if not sources:
                    tokens_to_remove.append(token)
        
        # Perform deletions
        for token in tokens_to_remove:
            original_text = self.reverse_mapping.get(token)
            if original_text and original_text in self.forward_mapping:
                del self.forward_mapping[original_text]
            
            if token in self.reverse_mapping:
                del self.reverse_mapping[token]
            
            if token in self.metadata:
                del self.metadata[token]
                
        if tokens_to_remove or any(source_filename in m.get("sources", []) for m in self.metadata.values()):
            self.save_vault()
            print(f"Removed references for {source_filename}. Deleted {len(tokens_to_remove)} orphaned entities.")

    def get_original(self, token):
        """
        Retrieves the original text for a given token.
        Returns the token itself if no mapping is found.
        """
        return self.reverse_mapping.get(token, token)

    def get_live_entity_counts(self):
        """
        Calculates the actual count of entities currently in the vault by type.
        This differs from self.entity_counters which is a monotonic ID generator.
        """
        counts = defaultdict(int)
        for meta in self.metadata.values():
            # Use the 'type' field from metadata if available, or fallback/infer
            etype = meta.get("type", "UNKNOWN")
            # We want to group by the readable prefix (e.g. "Person" instead of "PERSON")
            # Re-use the map function or just use the raw type? 
            # The dashboard likely expects keys like "Person", "Org".
            # The token usually starts with "Person_", so we can split the token too.
            # But relying on metadata type is cleaner. 
            # Let's normalize it using the helper if possible, or just capitalize.
            prefix = self._map_entity_type_to_prefix(etype)
            counts[prefix] += 1
        return dict(counts)

    def _map_entity_type_to_prefix(self, entity_type):
        """Maps NER labels to cleaner token prefixes."""
        # Standard Spacy labels 
        mapping = {
            "PERSON": "Person",
            "PER": "Person",
            "ORG": "Org",
            "GPE": "Location",
            "LOC": "Location",
            "DATE": "Date",
            "TIME": "Time",
            "MONEY": "Money",
            "CARDINAL": "Number",
            "ORDINAL": "Number",
            "FAC": "Facility",
            "NORP": "Group",
            "PRODUCT": "Product",
            "EVENT": "Event",
            "WORK_OF_ART": "Work",
            "LAW": "Law",
            "LANGUAGE": "Lang"
        }
        return mapping.get(entity_type.upper(), "Entity")

    def serialize_for_graph(self):
        """
        Serializes the Identity Vault into a graph structure for visualization.
        
        Returns:
            dict: Graph data with nodes and links structure:
                - nodes: List of {id, label, type, group, color, sources}
                - links: List of {source, target, value} where entities share sources
        """
        nodes = []
        links = []
        
        # Color mapping for different entity types
        type_colors = {
            "Person": "#3b82f6",      # Blue
            "Org": "#10b981",         # Green
            "Location": "#f59e0b",    # Amber
            "Date": "#8b5cf6",        # Purple
            "Time": "#ec4899",        # Pink
            "Money": "#14b8a6",       # Teal
            "Number": "#6366f1",      # Indigo
            "Facility": "#84cc16",    # Lime
            "Group": "#f97316",       # Orange
            "Product": "#06b6d4",     # Cyan
            "Event": "#a855f7",       # Purple
            "Work": "#d946ef",        # Fuchsia
            "Law": "#0ea5e9",         # Sky
            "Lang": "#22c55e",        # Green
            "Entity": "#64748b"       # Slate (default)
        }
        
        # 1. Build nodes from metadata
        for token, meta in self.metadata.items():
            entity_type = meta.get("type", "UNKNOWN")
            prefix = self._map_entity_type_to_prefix(entity_type)
            sources = meta.get("sources", [])
            
            node = {
                "id": token,
                "label": token,
                "type": prefix,
                "group": prefix,
                "color": type_colors.get(prefix, type_colors["Entity"]),
                "sources": sources,
                "val": len(sources) + 1  # Node size based on number of sources
            }
            nodes.append(node)
        
        # 2. Build links based on co-occurrence in source documents
        # Create a map of source -> tokens
        source_to_tokens = defaultdict(list)
        for token, meta in self.metadata.items():
            for source in meta.get("sources", []):
                source_to_tokens[source].append(token)
        
        # Create links between tokens that share sources
        link_strength = {}  # (token1, token2) -> count of shared sources
        
        for source, tokens in source_to_tokens.items():
            # Safeguard: Skip sources with too many entities to prevent O(k^2) explosion
            if len(tokens) > MAX_ENTITIES_PER_SOURCE:
                continue
            
            # Create links between all pairs of tokens in this source
            for i in range(len(tokens)):
                for j in range(i + 1, len(tokens)):
                    token1, token2 = sorted([tokens[i], tokens[j]])
                    key = (token1, token2)
                    link_strength[key] = link_strength.get(key, 0) + 1
        
        # Safeguard: Only emit links above minimum co-occurrence threshold
        filtered_links = {k: v for k, v in link_strength.items() if v >= MIN_COOCCURRENCE_THRESHOLD}
        
        # Safeguard: Limit to top-N strongest links per node
        # Build adjacency list for each node
        node_links = defaultdict(list)  # node -> [(strength, other_node, link_key)]
        for (token1, token2), strength in filtered_links.items():
            link_key = (token1, token2)
            node_links[token1].append((strength, token2, link_key))
            node_links[token2].append((strength, token1, link_key))
        
        # For each node, keep only top-N strongest links
        # Use a greedy approach: process nodes and select their top links
        selected_links = set()
        
        for node, links_list in node_links.items():
            # Sort by strength (descending) and take top-N
            top_links = sorted(links_list, key=lambda x: x[0], reverse=True)[:MAX_LINKS_PER_NODE]
            for strength, other_node, link_key in top_links:
                selected_links.add(link_key)
        
        # Convert to links array, ensuring each node respects the limit
        # Re-process to enforce strict per-node limit
        final_node_link_count = defaultdict(int)
        final_links = []
        
        # Sort all selected links by strength (stronger links get priority)
        all_links_sorted = sorted(
            [(strength, token1, token2) for (token1, token2), strength in filtered_links.items() if (token1, token2) in selected_links],
            key=lambda x: x[0],
            reverse=True
        )
        
        for strength, token1, token2 in all_links_sorted:
            # Only add if both nodes haven't reached their limit
            if final_node_link_count[token1] < MAX_LINKS_PER_NODE and final_node_link_count[token2] < MAX_LINKS_PER_NODE:
                final_links.append({
                    "source": token1,
                    "target": token2,
                    "value": strength
                })
                final_node_link_count[token1] += 1
                final_node_link_count[token2] += 1
        
        links.extend(final_links)
        
        return {
            "nodes": nodes,
            "links": links
        }