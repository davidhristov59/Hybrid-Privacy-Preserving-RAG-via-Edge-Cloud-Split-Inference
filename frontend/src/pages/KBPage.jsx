import { useState, useEffect } from "react";
import { FolderIcon, TrashIcon, FileIcon } from "../components/Icons";
import { StatCard } from "../components/StatCard";
import { DropZone } from "../components/DropZone";
import { apiFetch } from "../utils/api";

export const KBPage = ({ stats, showToast, refreshStats }) => {
  const [docs, setDocs] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null); // Track specific deleting ID

  const fetchDocs = async () => {
    try {
      const data = await apiFetch("/documents");
      setDocs(data);
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

  const handleDelete = async (filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    setDeleting(filename);
    try {
      await apiFetch(`/documents/${filename}`, { method: "DELETE" });
      showToast(`${filename} deleted`);
      await Promise.all([fetchDocs(), refreshStats()]);
    } catch { showToast("Delete failed", "error"); }
    setDeleting(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background h-screen">
      {/* Header */}
      <header className="px-8 py-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderIcon size={20} className="text-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Masked Entities" value={stats.total_entities} accent />
            <StatCard label="Indexed Documents" value={docs.length} />
            <StatCard label="System Status" value="Online" />
          </div>
        )}

        <div className="flex flex-col gap-8">
          {/* Upload Section */}
          <div className="w-full">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Upload Data</h3>
              <DropZone 
                onFiles={(files) => {
                  if (uploading) return;
                  const remaining = 10 - uploadFiles.length;
                  if (remaining <= 0) return; 
                  setUploadFiles(prev => [...prev, ...files.slice(0, remaining)]);
                }} 
                disabled={uploading} 
              />

              {uploadFiles.length > 0 && (
                <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg text-xs border border-border">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          <span className="text-foreground font-medium truncate" title={f.name}>{f.name}</span>
                        </div>
                        <button onClick={() => handleRemoveFile(i)} disabled={uploading} className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleUpload} 
                      disabled={uploading} 
                      className="px-8 py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
                    >
                      {uploading ? "Processing..." : `Index ${uploadFiles.length} Files`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document List Section */}
          <div className="w-full">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-secondary/20 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Active Documents</h3>
                <span className="text-xs text-muted-foreground font-mono">{docs.length} items</span>
              </div>
              
              {docs.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm font-mono">
                  No documents found. Upload files above to populate the index.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {docs.map((doc, i) => (
                    <div key={i} className="group px-6 py-4 flex items-center justify-between hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center border shrink-0
                          ${doc.file_type === 'pdf' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"}
                        `}>
                          <FileIcon type={doc.file_type} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate" title={doc.filename}>{doc.filename}</div>
                          <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                            {(doc.size_bytes / 1024).toFixed(1)} KB • {doc.file_type}
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(doc.filename)} 
                        disabled={deleting === doc.filename}
                        className={`
                          p-2 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0
                          ${deleting === doc.filename ? "bg-destructive/10 text-destructive cursor-not-allowed" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}
                        `}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
