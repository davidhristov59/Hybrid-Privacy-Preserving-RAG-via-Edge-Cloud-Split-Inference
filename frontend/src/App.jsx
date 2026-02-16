import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Sidebar } from "./components/Sidebar";
import { ChatPage } from "./pages/ChatPage";
import { KBPage } from "./pages/KBPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EvaluatePage } from "./pages/EvaluatePage";
import { apiFetch } from "./utils/api";

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
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        <Sidebar stats={stats} />
        <div className="flex-1 ml-64 relative"> {/* Offset sidebar width */}
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage stats={stats} />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/knowledge_base" element={<KBPage stats={stats} showToast={showToast} refreshStats={fetchStats} />} />
            <Route path="/evaluate" element={<EvaluatePage />} />
          </Routes>
        </div>
      </div>
      
      {toast && (
        <div className={`
          fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg border text-xs font-mono flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300
          ${toast.type === "error" ? "bg-destructive/10 border-destructive text-destructive" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"}
        `}>
          <span className="text-lg">{toast.type === "error" ? "⚠" : "✓"}</span>
          {toast.msg}
        </div>
      )}
    </BrowserRouter>
  );
}
