import { useState, useEffect, useRef } from "react";
import DocumentDashboard from "./DocumentDashboard";

const API_BASE_URL = "http://localhost:8000";

// --- Fonts & Global Styles ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #080c10;
      --surface: #0d1117;
      --surface2: #131a22;
      --surface3: #1a2332;
      --border: #1e2d40;
      --border2: #243545;
      --accent: #00e5ff;
      --accent2: #0090a8;
      --accent-dim: rgba(0, 229, 255, 0.06);
      --green: #00ff88;
      --green-dim: rgba(0, 255, 136, 0.1);
      --red: #ff4757;
      --red-dim: rgba(255, 71, 87, 0.1);
      --text: #e8f4f8;
      --text2: #8ba3b5;
      --text3: #4a6478;
      --font: 'Syne', sans-serif;
      --mono: 'JetBrains Mono', monospace;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--surface); }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent2); }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `}</style>
);

// --- API Helper ---
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Icons ---
const ShieldIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
  </svg>
);
const ChatIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const FolderIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
);
const GridIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const UploadIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const SendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const LockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const EyeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Spinner = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

// --- Reusable Components ---
const StatCard = ({ label, value, accent = false }) => (
  <div style={{
    background: accent ? "var(--accent-dim)" : "var(--surface2)",
    border: `1px solid ${accent ? "var(--accent2)" : "var(--border)"}`,
    borderRadius: 10, padding: "18px 22px", animation: "fadeUp 0.4s ease both",
  }}>
    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 500, color: accent ? "var(--accent)" : "var(--text)", letterSpacing: "-0.02em" }}>{value}</div>
  </div>
);

const AuditPanel = ({ maskedText }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none",
        border: "1px solid var(--border)", borderRadius: 6, color: "var(--text3)",
        fontFamily: "var(--mono)", fontSize: 11, padding: "5px 10px",
        cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.06em",
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent2)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
      >
        <LockIcon size={12} />{open ? "HIDE" : "VIEW"} PRIVACY AUDIT
      </button>
      {open && (
        <div style={{
          marginTop: 8, background: "var(--bg)", border: "1px solid var(--border2)",
          borderLeft: "2px solid var(--accent2)", borderRadius: "0 8px 8px 0",
          padding: "14px 16px", animation: "fadeUp 0.25s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <EyeIcon size={13} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.08em" }}>WHAT THE CLOUD SAW</span>
          </div>
          <pre style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, margin: 0 }}>
            {maskedText || "(no context captured)"}
          </pre>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12 }}>
            <CheckIcon size={13} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)", letterSpacing: "0.06em" }}>PII REDACTED BEFORE TRANSMISSION</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatMessage = ({ role, content, audit }) => {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        {!isUser && (
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon size={11} color="var(--accent)" />
          </div>
        )}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {isUser ? "You" : "System"}
        </span>
      </div>
      <div style={{
        maxWidth: "78%", background: isUser ? "var(--surface3)" : "var(--surface2)",
        border: `1px solid ${isUser ? "var(--border2)" : "var(--border)"}`,
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "var(--text)", fontFamily: "var(--font)",
        ...(isUser ? { borderRight: "2px solid var(--accent2)" } : {}),
      }}>
        {content}
      </div>
      {!isUser && audit && <AuditPanel maskedText={audit} />}
    </div>
  );
};

const DropZone = ({ onFiles, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(Array.from(e.target.files));
    }
  };

  return (
    <div onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`,
        borderRadius: 12, padding: "36px 24px", textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        background: dragging ? "var(--accent-dim)" : "var(--surface2)",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}>
      <input ref={inputRef} type="file" accept=".pdf,.csv" multiple style={{ display: "none" }} onChange={handleChange} />
      <div style={{ marginBottom: 10 }}>
        <UploadIcon size={28} color={dragging ? "var(--accent)" : "var(--text3)"} />
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", letterSpacing: "0.06em" }}>
        DROP FILES HERE (PDF, CSV)
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 6 }}>
        or click to browse · Max 10 files
      </div>
    </div>
  );
};

// ── SIDEBAR ───────────────────────────────────────────────
const Sidebar = ({ page, setPage, stats }) => (
  <aside style={{
    width: 220, minHeight: "100vh", background: "var(--surface)",
    borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
    padding: "28px 0", flexShrink: 0,
  }}>
    <div style={{ padding: "0 24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldIcon size={17} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text)" }}>PRIV·RAG</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em" }}>EDGE-CLOUD SPLIT</div>
        </div>
      </div>
    </div>
    <nav style={{ flex: 1 }}>
      {[
        { id: "chat",      label: "Secure Chat",    icon: <ChatIcon size={16} /> },
        { id: "kb",        label: "Knowledge Base", icon: <FolderIcon size={16} /> },
        { id: "dashboard", label: "Dashboard",      icon: <GridIcon size={16} /> },
      ].map(item => (
        <button key={item.id} onClick={() => setPage(item.id)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 24px", background: page === item.id ? "var(--accent-dim)" : "none",
          border: "none", borderLeft: `2px solid ${page === item.id ? "var(--accent)" : "transparent"}`,
          color: page === item.id ? "var(--accent)" : "var(--text2)",
          fontSize: 13, fontFamily: "var(--font)", fontWeight: page === item.id ? 600 : 400,
          cursor: "pointer", transition: "all 0.2s", textAlign: "left",
        }}
          onMouseOver={e => { if (page !== item.id) { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)"; } }}
          onMouseOut={e => { if (page !== item.id) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text2)"; } }}
        >
          {item.icon}{item.label}
        </button>
      ))}
    </nav>
    <div style={{ padding: "0 24px" }}>
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", letterSpacing: "0.08em" }}>VAULT ACTIVE</span>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
          {stats ? `${stats.total_entities} entities masked` : "Loading..."}
        </div>
      </div>
    </div>
  </aside>
);

// ── CHAT PAGE ─────────────────────────────────────────────
const ChatPage = ({ messages, input, setInput, loading, handleSend, messagesEndRef }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100vh", flex: 1 }}>
    <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--surface)" }}>
      <ChatIcon size={18} />
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>Secure Chat</span>
      <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em" }}>
        PII MASKED AT EDGE · SAFE CLOUD INFERENCE
      </span>
    </div>
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      {messages.length === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, opacity: 0.5 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon size={24} color="var(--accent2)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>Privacy Mode Active</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>Sensitive entities are redacted before reaching the cloud</div>
          </div>
        </div>
      )}
      {messages.map((msg, i) => <ChatMessage key={i} {...msg} />)}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.3s ease" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon size={11} color="var(--accent)" />
          </div>
          <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "14px 14px 14px 4px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent2)", animation: `pulse 1.2s ${i * 0.2}s ease infinite` }} />
            ))}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
    <div style={{ padding: "20px 32px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ display: "flex", gap: 10, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 12, padding: "10px 14px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask about your documents..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, lineHeight: 1.5 }}
        />
        <button onClick={handleSend} disabled={!input.trim() || loading} style={{
          background: input.trim() && !loading ? "var(--accent)" : "var(--surface3)",
          border: "none", borderRadius: 8, padding: "8px 14px",
          color: input.trim() && !loading ? "#000" : "var(--text3)",
          cursor: input.trim() && !loading ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
        }}>
          {loading ? <Spinner size={16} /> : <SendIcon size={16} />}
        </button>
      </div>
      <div style={{ marginTop: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textAlign: "center", letterSpacing: "0.06em" }}>
        <LockIcon size={11} /> &nbsp;ENTER TO SEND · PII STRIPPED LOCALLY BEFORE TRANSMISSION
      </div>
    </div>
  </div>
);

// ── KNOWLEDGE BASE PAGE ───────────────────────────────────
const KBPage = ({ docs, stats, uploadFiles, setUploadFiles, uploading, handleUpload, selectedDoc, setSelectedDoc, deleting, handleDelete }) => {
  const handleRemoveFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
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
              // Limit check
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

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage]               = useState("chat");
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [docs, setDocs]               = useState([]);
  const [stats, setStats]             = useState(null);
  
  // CHANGED: Manage array of files
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading]     = useState(false);
  
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState(null);
  const messagesEndRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDocs = async () => {
    try {
      const data = await apiFetch("/documents");
      setDocs(data);
      if (data.length > 0 && !selectedDoc) setSelectedDoc(data[0].filename);
    } catch { showToast("Failed to load documents", "error"); }
  };

  const fetchStats = async () => {
    try { setStats(await apiFetch("/vault-stats")); } catch {}
  };

  useEffect(() => { fetchDocs(); fetchStats(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    
    const now = Date.now();
    const newMessage = { role: "user", content: userMsg, timestamp: now };
    
    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);
    
    // Prepare History (Max 10 messages, max 30 mins old)
    // We filter the *existing* messages, excluding the one we just added (since we want history *before* this)
    // Actually, sending the current one as part of history is redundant if the API expects "history" + "current_message".
    // So we take `messages` (current state before update)
    const thirtyMinsAgo = now - (30 * 60 * 1000);
    const validHistory = messages
      .filter(m => m.timestamp && m.timestamp > thirtyMinsAgo) // Time limit
      .slice(-10) // Count limit (last 10)
      .map(m => ({ role: m.role, content: m.content })); // Clean payload

    try {
      const data = await apiFetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg,
          history: validHistory
        }),
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.response || "No response.", 
        audit: data.context || "",
        timestamp: Date.now() 
      }]);
    } catch {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠ Connection error. Is the API running?",
        timestamp: Date.now()
      }]);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    
    let successCount = 0;
    
    // Process sequentially to be safe
    for (const file of uploadFiles) {
      try {
        const form = new FormData();
        form.append("file", file);
        await apiFetch("/upload-document", { method: "POST", body: form });
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }
    
    if (successCount === uploadFiles.length) {
      showToast(`${successCount} files uploaded & masked`);
    } else {
      showToast(`${successCount}/${uploadFiles.length} uploaded successfully`, "error");
    }
    
    setUploadFiles([]);
    setUploading(false);
    await Promise.all([fetchDocs(), fetchStats()]);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      await apiFetch(`/documents/${selectedDoc}`, { method: "DELETE" });
      showToast(`${selectedDoc} deleted`);
      setSelectedDoc(null);
      await Promise.all([fetchDocs(), fetchStats()]);
    } catch { showToast("Delete failed", "error"); }
    setDeleting(false);
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} stats={stats} />
        {page === "chat" && (
          <ChatPage
            messages={messages} input={input} setInput={setInput}
            loading={loading} handleSend={handleSend} messagesEndRef={messagesEndRef}
          />
        )}
        {page === "kb" && (
          <KBPage
            docs={docs} stats={stats}
            uploadFiles={uploadFiles} setUploadFiles={setUploadFiles}
            uploading={uploading} handleUpload={handleUpload}
            selectedDoc={selectedDoc} setSelectedDoc={setSelectedDoc}
            deleting={deleting} handleDelete={handleDelete}
          />
        )}
        {page === "dashboard" && <DocumentDashboard />}
      </div>
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "error" ? "var(--red-dim)" : "var(--green-dim)",
          border: `1px solid ${toast.type === "error" ? "var(--red)" : "var(--green)"}`,
          borderRadius: 10, padding: "12px 18px",
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: "var(--mono)", fontSize: 12,
          color: toast.type === "error" ? "var(--red)" : "var(--green)",
          animation: "fadeUp 0.3s ease", zIndex: 9999, maxWidth: 320,
          backdropFilter: "blur(10px)",
        }}>
          {toast.type === "error" ? "⚠" : "✓"} {toast.msg}
        </div>
      )}
    </>
  );
}