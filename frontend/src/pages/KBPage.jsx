import { useState, useEffect } from "react";
import { FolderIcon, TrashIcon, UploadIcon, Spinner } from "../components/Icons";
import { StatCard } from "../components/StatCard";
import { DropZone } from "../components/DropZone";
import { apiFetch } from "../utils/api";

export const KBPage = ({ stats, showToast, refreshStats }) => {
  const [docs, setDocs] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await apiFetch("/documents");
      setDocs(data);
      if (data.length > 0 && !selectedDoc) setSelectedDoc(data[0].filename);
    } catch { showToast("Failed to load documents", "error"); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleRemoveFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of uploadFiles) {
      try {
        const form = new FormData();
        form.append("file", file);
        await apiFetch("/upload-document", { method: "POST", body: form });
        successCount++;
      } catch (e) { console.error(e); }
    }
    if (successCount === uploadFiles.length) showToast(`${successCount} files uploaded & masked`);
    else showToast(`${successCount}/${uploadFiles.length} uploaded`, "error");
    
    setUploadFiles([]);
    setUploading(false);
    await Promise.all([fetchDocs(), refreshStats()]);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      await apiFetch(`/documents/${selectedDoc}`, { method: "DELETE" });
      showToast(`${selectedDoc} deleted`);
      setSelectedDoc(null);
      await Promise.all([fetchDocs(), refreshStats()]);
    } catch { showToast("Delete failed", "error"); }
    setDeleting(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--surface)" }}>
        <FolderIcon size={18} />
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>Knowledge Base</span>
      </div>
      <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 28 }}>
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, animation: "fadeUp 0.35s ease" }}>
            <StatCard label="Masked Entities" value={stats.total_entities} accent />
            <StatCard label="Documents" value={docs.length} />
            <StatCard label="Vault Status" value="Active" />
          </div>
        )}
        
        {/* Upload Section */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, letterSpacing: "0.03em" }}>Add Documents</div>
          <DropZone onFiles={(files) => {
              if (uploading) return;
              const remaining = 10 - uploadFiles.length;
              if (remaining <= 0) return; 
              setUploadFiles(prev => [...prev, ...files.slice(0, remaining)]);
            }} 
            disabled={uploading} 
          />

          {/* Pending Files List */}
          {uploadFiles.length > 0 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {uploadFiles.map((f, i) => (
                <div key={i} style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", background: "var(--surface2)", borderRadius: 8,
                  border: "1px solid var(--border2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }}></div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)" }}>{f.name}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                  <button onClick={() => handleRemoveFile(i)} disabled={uploading} style={{
                    background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4
                  }}>
                    <TrashIcon size={14} />
                  </button>
                </div>
              ))}
              
              <button onClick={handleUpload} disabled={uploading} style={{
                marginTop: 8, width: "100%",
                background: uploading ? "var(--surface3)" : "var(--accent)",
                border: "none", borderRadius: 9, padding: "12px 20px",
                color: uploading ? "var(--text3)" : "#000", fontFamily: "var(--font)",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                cursor: uploading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s",
              }}>
                {uploading ? <><Spinner size={15} /> Processing {uploadFiles.length} files...</> : <><UploadIcon size={15} /> Process & Index {uploadFiles.length} Files</>}
              </button>
            </div>
          )}
        </div>

        {/* Existing Docs Section */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px", animation: "fadeUp 0.45s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 18, letterSpacing: "0.03em" }}>Indexed Documents</div>
          {docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)" }}>
              No documents yet. Upload one to begin.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {docs.map((doc, i) => (
                  <div key={i} onClick={() => setSelectedDoc(doc.filename)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 9,
                    background: selectedDoc === doc.filename ? "var(--accent-dim)" : "var(--surface2)",
                    border: `1px solid ${selectedDoc === doc.filename ? "var(--accent2)" : "var(--border)"}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                      background: doc.file_type === "pdf" ? "rgba(255,71,87,0.1)" : "rgba(0,229,255,0.1)",
                      border: `1px solid ${doc.file_type === "pdf" ? "var(--red)" : "var(--accent2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
                      color: doc.file_type === "pdf" ? "var(--red)" : "var(--accent)",
                    }}>
                      {doc.file_type.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.filename}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{(doc.size_bytes / 1024).toFixed(1)} KB</div>
                    </div>
                    {selectedDoc === doc.filename && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
              {selectedDoc && (
                <button onClick={handleDelete} disabled={deleting} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: deleting ? "var(--surface3)" : "var(--red-dim)",
                  border: `1px solid ${deleting ? "var(--border)" : "var(--red)"}`,
                  borderRadius: 8, padding: "9px 16px",
                  color: deleting ? "var(--text3)" : "var(--red)",
                  fontSize: 12, fontFamily: "var(--font)", fontWeight: 600, letterSpacing: "0.04em",
                  cursor: deleting ? "default" : "pointer", transition: "all 0.2s",
                }}>
                  {deleting ? <Spinner size={13} /> : <TrashIcon size={13} />}
                  {deleting ? "Deleting..." : `Delete "${selectedDoc}"`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
