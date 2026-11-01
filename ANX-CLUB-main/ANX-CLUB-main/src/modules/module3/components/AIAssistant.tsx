"use client";

import { useState, useRef, useEffect } from "react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: messages })
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      {isOpen && (
        <div className="glass-panel" style={{ width: "350px", height: "450px", display: "flex", flexDirection: "column", marginBottom: "1rem", overflow: "hidden", padding: 0 }}>
          <div style={{ padding: "1rem", backgroundColor: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>✨ AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-color)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Hi there! 👋<br/><br/>I&apos;m the community AI Assistant.<br/>Ask me anything!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.role === "user" ? "var(--primary-color)" : "var(--surface-color)",
                padding: "0.75rem 1rem",
                borderRadius: "1rem",
                borderBottomRightRadius: msg.role === "user" ? "0.25rem" : "1rem",
                borderBottomLeftRadius: msg.role === "assistant" ? "0.25rem" : "1rem",
                maxWidth: "85%",
                lineHeight: 1.5,
                fontSize: "0.9rem",
                whiteSpace: "pre-wrap"
              }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", backgroundColor: "var(--surface-color)", padding: "0.75rem 1rem", borderRadius: "1rem", fontSize: "0.9rem", color: "var(--text-muted)", borderBottomLeftRadius: "0.25rem" }}>
                <span className="typing-dot">.</span><span className="typing-dot">.</span><span className="typing-dot">.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", padding: "1rem", borderTop: "1px solid var(--border-color)", gap: "0.5rem" }}>
            <input 
              type="text" 
              className="input-field" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Type your message..." 
              style={{ flex: 1, padding: "0.5rem 1rem", borderRadius: "2rem", fontSize: "0.9rem", minWidth: 0 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
              &uarr;
            </button>
          </form>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn btn-primary"
        style={{ width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 1001, transition: "transform 0.2s" }}
        onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "×" : "💬"}
      </button>
      <style>{`
        .typing-dot { animation: typing 1.4s infinite both; }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
