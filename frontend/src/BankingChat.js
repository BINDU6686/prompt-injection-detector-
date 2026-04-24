import { useState } from "react";

const API = "http://127.0.0.1:8000";

export default function BankingChat() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Welcome to AIB Bank. I am your virtual assistant. How can I help you today?",
      blocked: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityLog, setSecurityLog] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("idle");
  const [lastConfidence, setLastConfidence] = useState(null);

  async function sendMessage() {
    if (!input.trim()) return;
    setMessages(p => [...p, { role: "user", text: input, blocked: false }]);
    setInput("");
    setLoading(true);
    setCurrentStatus("checking");

    try {
      const r = await fetch(`${API}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, industry: "aib" }),
      });
      const d = await r.json();

      if (d.blocked) {
        setCurrentStatus("blocked");
        setLastConfidence(d.confidence);
        setSecurityLog(p => [
          { time: new Date().toLocaleTimeString(), status: "BLOCKED", confidence: Math.round(d.confidence * 100), prompt: input.slice(0, 45) + (input.length > 45 ? "..." : "") },
          ...p.slice(0, 9),
        ]);
        setMessages(p => [...p, {
          role: "bot",
          text: "Your message has been blocked by our security system. A prompt injection attack was detected. This incident has been logged.",
          blocked: true,
          confidence: d.confidence,
        }]);
      } else {
        setCurrentStatus("safe");
        setLastConfidence(null);
        setSecurityLog(p => [
          { time: new Date().toLocaleTimeString(), status: "SAFE", confidence: 0, prompt: input.slice(0, 45) + (input.length > 45 ? "..." : "") },
          ...p.slice(0, 9),
        ]);
        setMessages(p => [...p, { role: "bot", text: d.ai_response, blocked: false }]);
      }
    } catch (e) {
      setCurrentStatus("idle");
      setMessages(p => [...p, { role: "bot", text: "Sorry, I am unable to connect to the server. Please try again.", blocked: false }]);
    }
    setLoading(false);
  }

  const totalBlocked = securityLog.filter(l => l.status === "BLOCKED").length;
  const totalSafe = securityLog.filter(l => l.status === "SAFE").length;

  const suggestions = [
    "What are your opening hours?",
    "How do I apply for a mortgage?",
    "What are current interest rates?",
    "How do I report a lost card?",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#0A0A0A" }}>

      {/* AIB HEADER */}
      <div style={{ background: "#0F1F4B", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.5)", borderBottom: "1px solid #1a3a7a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 8, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18, color: "#0F1F4B", letterSpacing: 1 }}>AIB</div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold" }}>Allied Irish Banks</div>
            <div style={{ color: "#93C5FD", fontSize: 12, marginTop: 2, fontFamily: "monospace" }}>Virtual Customer Assistant</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "rgba(0,196,154,0.2)", border: "1px solid rgba(0,196,154,0.4)", borderRadius: 20, padding: "6px 16px", color: "#00C49A", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}>3 Layer Security Active</div>
          <div style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 20, padding: "6px 16px", color: "#C9A84C", fontSize: 11, fontFamily: "monospace" }}>Powered by ChatGPT</div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* LEFT — CHAT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0A0A0A" }}>

          {/* CHAT SUBHEADER */}
          <div style={{ background: "#111111", padding: "12px 24px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00C49A", boxShadow: "0 0 6px #00C49A" }}></div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#FFFFFF" }}>AIB Customer Support</div>
            <div style={{ fontSize: 11, color: "#666", marginLeft: "auto", fontFamily: "monospace" }}>Protected by Prompt Injection Detection Framework</div>
          </div>

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: "#0F1F4B", color: "#FFFFFF", padding: "12px 18px", borderRadius: "20px 20px 4px 20px", maxWidth: "65%", fontSize: 13.5, lineHeight: 1.6, border: "1px solid #1a3a7a" }}>
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.role === "bot" && !msg.blocked && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: "#0F1F4B", border: "1px solid #1a3a7a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>AIB</div>
                    <div style={{ background: "#111111", color: "#FFFFFF", padding: "12px 18px", borderRadius: "20px 20px 20px 4px", maxWidth: "65%", fontSize: 13.5, lineHeight: 1.6, border: "1px solid #222" }}>
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.role === "bot" && msg.blocked && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: "rgba(255,68,68,0.2)", border: "1px solid #FF4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF4444", fontSize: 16, fontWeight: "bold", flexShrink: 0 }}>!</div>
                    <div style={{ background: "rgba(255,68,68,0.1)", color: "#FF8888", padding: "14px 18px", borderRadius: "20px 20px 20px 4px", maxWidth: "68%", fontSize: 13.5, lineHeight: 1.6, border: "1.5px solid rgba(255,68,68,0.4)" }}>
                      <div style={{ fontWeight: "bold", fontSize: 12, marginBottom: 6, color: "#FF4444", fontFamily: "monospace" }}>SECURITY ALERT — Message Blocked</div>
                      <div>{msg.text}</div>
                      {msg.confidence && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#FF4444", fontWeight: "bold", fontFamily: "monospace" }}>
                          Detection Confidence: {Math.round(msg.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 36, height: 36, background: "#0F1F4B", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>AIB</div>
                <div style={{ background: "#111111", color: "#666", padding: "12px 18px", borderRadius: "20px 20px 20px 4px", fontSize: 13, border: "1px solid #222", fontFamily: "monospace" }}>
                  AIB Assistant is typing...
                </div>
              </div>
            )}
          </div>

          {/* SUGGESTIONS */}
          <div style={{ padding: "10px 20px", background: "#111111", borderTop: "1px solid #222", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ background: "rgba(15,31,75,0.5)", color: "#93C5FD", border: "1px solid #1a3a7a", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div style={{ background: "#111111", borderTop: "1px solid #222", padding: "16px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === "Enter" && sendMessage()}
              placeholder="Type your message to AIB Bank..."
              style={{ flex: 1, padding: "12px 18px", border: "1px solid #333", borderRadius: 25, fontSize: 13.5, outline: "none", color: "#FFFFFF", background: "#1A1A1A" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ background: "#0F1F4B", color: "#FFFFFF", border: "1px solid #1a3a7a", borderRadius: 25, padding: "12px 28px", fontSize: 13.5, fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 8px rgba(15,31,75,0.5)" }}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        {/* RIGHT — SECURITY PANEL */}
        <div style={{ width: 300, display: "flex", flexDirection: "column", background: "#111111", borderLeft: "1px solid #222" }}>

          {/* PANEL HEADER */}
          <div style={{ background: "#0F1F4B", padding: "14px 18px", borderBottom: "1px solid #1a3a7a" }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#FFFFFF" }}>Security Monitor</div>
            <div style={{ fontSize: 11, color: "#93C5FD", marginTop: 2, fontFamily: "monospace" }}>Prompt Injection Detection Framework</div>
          </div>

          {/* STATS */}
          <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
            {[
              { label: "Checked", val: securityLog.length, color: "#C9A84C" },
              { label: "Blocked", val: totalBlocked, color: "#FF4444" },
              { label: "Safe", val: totalSafe, color: "#00C49A" },
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, padding: "14px 8px", textAlign: "center", borderRight: i < 2 ? "1px solid #222" : "none" }}>
                <div style={{ fontSize: 24, fontWeight: "bold", color: stat.color, fontFamily: "monospace" }}>{stat.val}</div>
                <div style={{ fontSize: 10, color: "#666", marginTop: 3, fontFamily: "monospace" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* STATUS */}
          <div style={{ margin: 14, padding: 14, borderRadius: 10, background: currentStatus === "blocked" ? "rgba(255,68,68,0.1)" : currentStatus === "safe" ? "rgba(0,196,154,0.1)" : currentStatus === "checking" ? "rgba(201,168,76,0.1)" : "#1A1A1A", border: `1px solid ${currentStatus === "blocked" ? "rgba(255,68,68,0.4)" : currentStatus === "safe" ? "rgba(0,196,154,0.4)" : currentStatus === "checking" ? "rgba(201,168,76,0.4)" : "#333"}` }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: currentStatus === "blocked" ? "#FF4444" : currentStatus === "safe" ? "#00C49A" : currentStatus === "checking" ? "#C9A84C" : "#666", marginBottom: 6, fontFamily: "monospace" }}>
              {currentStatus === "idle" && "// Awaiting Message"}
              {currentStatus === "checking" && "// Analysing Message..."}
              {currentStatus === "safe" && "// Message Safe"}
              {currentStatus === "blocked" && "// Attack Detected"}
            </div>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, fontFamily: "monospace" }}>
              {currentStatus === "idle" && "All messages checked through 3 security layers before reaching AIB assistant."}
              {currentStatus === "checking" && "Running through Layer 1, Layer 2 and Layer 3..."}
              {currentStatus === "safe" && "All 3 layers confirmed safe. Message passed to ChatGPT."}
              {currentStatus === "blocked" && `Attack detected with ${lastConfidence ? Math.round(lastConfidence * 100) : 0}% confidence. Blocked before reaching AI.`}
            </div>
          </div>

          {/* LAYERS */}
          <div style={{ margin: "0 14px 14px", padding: 14, background: "#1A1A1A", borderRadius: 10, border: "1px solid #222" }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#C9A84C", marginBottom: 12, fontFamily: "monospace" }}>Detection Layers</div>
            {[
              { name: "Layer 1 — Rule-Based", desc: "25 attack signatures" },
              { name: "Layer 2 — BERT AI", desc: "Semantic understanding" },
              { name: "Layer 3 — LLM Guardrail", desc: "Output verification" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C49A", boxShadow: "0 0 4px #00C49A", flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: "#FFFFFF", fontFamily: "monospace" }}>{l.name}</div>
                  <div style={{ fontSize: 10, color: "#666" }}>{l.desc}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: "bold", color: "#00C49A", fontFamily: "monospace" }}>Active</div>
              </div>
            ))}
          </div>

          {/* LOG */}
          <div style={{ margin: "0 14px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#C9A84C", marginBottom: 10, fontFamily: "monospace" }}>Detection Log</div>
            {securityLog.length === 0 && (
              <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", fontStyle: "italic" }}>No activity yet. Send a message to begin.</div>
            )}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {securityLog.map((log, i) => (
                <div key={i} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: log.status === "BLOCKED" ? "rgba(255,68,68,0.1)" : "rgba(0,196,154,0.1)", border: `1px solid ${log.status === "BLOCKED" ? "rgba(255,68,68,0.3)" : "rgba(0,196,154,0.3)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", fontSize: 11, color: log.status === "BLOCKED" ? "#FF4444" : "#00C49A", fontFamily: "monospace" }}>{log.status}</span>
                    <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>{log.time}</span>
                  </div>
                  {log.status === "BLOCKED" && (
                    <div style={{ fontSize: 10, color: "#FF4444", marginTop: 2, fontFamily: "monospace" }}>Confidence: {log.confidence}%</div>
                  )}
                  <div style={{ fontSize: 10, color: "#555", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{log.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}