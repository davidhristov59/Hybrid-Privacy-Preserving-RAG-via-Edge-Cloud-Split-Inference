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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="px-8 py-5 border-b border-border bg-card/50 backdrop-blur-sm flex items-center gap-3 sticky top-0 z-10">
        <ChatIcon size={20} className="text-foreground" />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Secure Chat</h1>
        <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-white/5">
          <ShieldIcon size={12} className="text-emerald-500" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">End-to-End Privacy</span>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6 ring-1 ring-white/10">
                <ShieldIcon size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Privacy Mode Active</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Queries are saniitized locally before reaching the cloud.
                Personally Identifiable Information (PII) is restored upon response.
              </p>
            </div>
          )}
          
          {messages.map((msg, i) => <ChatMessage key={i} {...msg} />)}
          
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center text-muted-foreground">
                <ShieldIcon size={12} />
              </div>
              <div className="flex gap-1.5 px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm shadow-sm items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl" />
            <div className="relative flex gap-3 bg-background border border-input ring-offset-background rounded-xl px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:border-transparent">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask a question about your documents..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                autoFocus
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || loading}
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${input.trim() && !loading 
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md scale-100" 
                    : "bg-secondary text-muted-foreground opacity-50 scale-95 cursor-not-allowed"}
                `}
              >
                {loading ? <Spinner size={16} className="text-current" /> : <SendIcon size={16} />}
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-center items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <LockIcon size={10} />
            <span>Encrypted Pipeline · Zero-Trust Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
