import { useState, useEffect, useRef } from "react";
import { ChatIcon, ShieldIcon, Spinner, SendIcon, LockIcon } from "../components/Icons";
import { ChatMessage } from "../components/ChatMessage";
import { apiFetch } from "../utils/api";

export const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    
    const now = Date.now();
    const newMessage = { role: "user", content: userMsg, timestamp: now };
    
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);
    
    const thirtyMinsAgo = now - (30 * 60 * 1000);
    const validHistory = messages
      .filter(m => m.timestamp && m.timestamp > thirtyMinsAgo)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

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

  return (
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
};
