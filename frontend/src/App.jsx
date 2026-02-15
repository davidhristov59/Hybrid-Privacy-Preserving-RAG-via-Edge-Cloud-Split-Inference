import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Sidebar } from "./components/Sidebar";
import { ChatPage } from "./pages/ChatPage";
import { KBPage } from "./pages/KBPage";
import DocumentDashboard from "./DocumentDashboard";
import { apiFetch } from "./utils/api";

// --- Global Styles ---
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

export default function App() {
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchStats = async () => {
    try { setStats(await apiFetch("/vault-stats")); } catch {}
  };

  useEffect(() => { fetchStats(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <BrowserRouter>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar stats={stats} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DocumentDashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/knowledge_base" element={<KBPage stats={stats} showToast={showToast} refreshStats={fetchStats} />} />
        </Routes>
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
    </BrowserRouter>
  );
}
