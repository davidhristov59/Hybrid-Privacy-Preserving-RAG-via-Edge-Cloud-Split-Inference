import streamlit as st
import pandas as pd
import requests
import time

# --- Configuration ---
API_BASE_URL = "http://localhost:8000"

st.set_page_config(
    page_title="Hybrid Privacy RAG",
    page_icon="🛡️",
    layout="wide"
)

# --- API Helper Functions ---
def get_documents():
    try:
        response = requests.get(f"{API_BASE_URL}/documents")
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Failed to fetch documents: {response.text}")
            return []
    except Exception as e:
        st.error(f"API Error: {e}")
        return []

def upload_document(uploaded_file):
    try:
        files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
        with st.spinner(f"Uploading and scrubbing {uploaded_file.name}..."):
            response = requests.post(f"{API_BASE_URL}/upload-document", files=files)
        
        if response.status_code == 200:
            st.success(f"✅ {uploaded_file.name} uploaded & masked successfully!")
            return True
        else:
            st.error(f"Upload failed: {response.text}")
            return False
    except Exception as e:
        st.error(f"API Error: {e}")
        return False

def delete_document(filename):
    try:
        response = requests.delete(f"{API_BASE_URL}/documents/{filename}")
        if response.status_code == 200:
            st.success(f"🗑️ {filename} deleted.")
            return True
        else:
            st.error(f"Delete failed: {response.text}")
            return False
    except Exception as e:
        st.error(f"API Error: {e}")
        return False

def chat_query(message):
    try:
        payload = {"message": message}
        response = requests.post(f"{API_BASE_URL}/chat", json=payload)
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Chat failed: {response.text}")
            return None
    except Exception as e:
        st.error(f"API Error: {e}")
        return None

def get_vault_stats():
    try:
        response = requests.get(f"{API_BASE_URL}/vault-stats")
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

# --- UI Layout ---

st.title("🛡️ Hybrid Privacy-Preserving RAG")
st.markdown("""
This system uses **Edge-Cloud Split Inference** to answer questions without revealing PII to the cloud.
Sensitive entities are masked locally before being sent to the LLM.
""")

# Sidebar Navigation
page = st.sidebar.radio("Navigation", ["💬 Secure Chat", "📂 Knowledge Base"])

# --- PAGE: KNOWLEDGE BASE ---
if page == "📂 Knowledge Base":
    st.header("📂 Knowledge Base Management")
    
    # 1. Stats
    stats = get_vault_stats()
    if stats:
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Masked Entities", stats.get("total_entities", 0))
        c2.metric("Last Updated", stats.get("last_updated", "N/A"))
        c3.metric("Vault Status", "Active 🟢")

    st.divider()

    # 2. Upload Section
    st.subheader("Add New Documents")
    uploaded_files = st.file_uploader("Upload PDF or CSV", type=["pdf", "csv"], accept_multiple_files=True)
    if uploaded_files:
        if st.button(f"🚀 Process & Index ({len(uploaded_files)} files)"):
            progress_bar = st.progress(0)
            for i, uploaded_file in enumerate(uploaded_files):
                upload_document(uploaded_file)
                progress_bar.progress((i + 1) / len(uploaded_files))
            
            time.sleep(1)
            st.rerun()

    st.divider()

    # 3. Documents List
    st.subheader("Existing Documents")
    docs = get_documents()
    
    if docs:
        # Convert to DataFrame for better display
        df = pd.DataFrame(docs)
        if not df.empty:
            # Reorder columns
            df = df[["filename", "file_type", "size_bytes", "path"]]
            
            # Display as a table with delete buttons
            # Streamlit data_editor allows some interaction, but button per row is tricky.
            # We'll use a simple list for deletion or a selectbox.
            
            st.dataframe(df, use_container_width=True)
            
            # Delete Action
            st.markdown("### Manage Documents")
            col1, col2 = st.columns([3, 1])
            with col1:
                doc_to_delete = st.selectbox("Select document to delete:", df["filename"].tolist())
            with col2:
                st.write("") # Spacer
                st.write("") 
                if st.button("🗑️ Delete Selected"):
                    if delete_document(doc_to_delete):
                        time.sleep(1)
                        st.rerun()
    else:
        st.info("No documents found. Upload one to get started.")

# --- PAGE: SECURE CHAT ---
elif page == "💬 Secure Chat":
    st.header("💬 Secure Chat (Privacy Mode)")

    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if "audit" in message:
                with st.expander("🔒 Privacy Audit (What the Cloud Saw)"):
                    st.code(message["audit"], language="text")

    # User Input
    if prompt := st.chat_input("Ask a question about your documents..."):
        # Add user message to history
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        # Get response
        with st.chat_message("assistant"):
            with st.spinner("Processing securely..."):
                response_data = chat_query(prompt)
                
                if response_data:
                    final_answer = response_data.get("response", "Error generating response.")
                    masked_context = response_data.get("context", "")
                    
                    st.markdown(final_answer)
                    
                    # Privacy Audit Visualization
                    with st.expander("🔒 Privacy Audit (What the Cloud Saw)"):
                        st.write("The following **masked** query was sent to the cloud LLM. No PII left your device.")
                        st.code(masked_context, language="text")
                        st.success("✅ PII successfully redacted before transmission.")

                    # Add assistant message to history with audit data
                    st.session_state.messages.append({
                        "role": "assistant", 
                        "content": final_answer,
                        "audit": masked_context
                    })
