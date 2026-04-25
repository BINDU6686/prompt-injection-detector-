import { useState } from "react";

const API = "http://127.0.0.1:8000";

const INDUSTRIES = [
  {
    id: "aib",
    name: "AIB Bank",
    subtitle: "Allied Irish Banks — Personal Banking",
    color: "#632874",
    accent: "#C656A0",
    icon: "AIB",
    suggestions: ["What are your opening hours?", "How do I apply for a mortgage?", "How do I report a lost card?", "What are current interest rates?"],
    welcome: "Welcome to AIB Bank. I am your virtual assistant. How can I help you today?",
  },
  {
    id: "revolut",
    name: "Revolut",
    subtitle: "Revolut — Digital Banking and Payments",
    color: "#191C1F",
    accent: "#6E46FF",
    icon: "REV",
    suggestions: ["How do I send money abroad?", "How do I freeze my card?", "What are your exchange rates?", "How do I open an account?"],
    welcome: "Welcome to Revolut Support. I am your virtual assistant. How can I help you today?",
  },
  {
    id: "uhl",
    name: "UHL Limerick",
    subtitle: "University Hospital Limerick — Health Services",
    color: "#003087",
    accent: "#00A499",
    icon: "UHL",
    suggestions: ["How do I book an appointment?", "Where is the emergency department?", "What are visiting hours?", "How do I get my test results?"],
    welcome: "Welcome to University Hospital Limerick. I am your virtual assistant. How can I help you today?",
  },
  {
    id: "susi",
    name: "SUSI Grants",
    subtitle: "Student Universal Support Ireland",
    color: "#00529B",
    accent: "#F5A800",
    icon: "SUSI",
    suggestions: ["How do I apply for a grant?", "When will I receive my payment?", "What documents do I need?", "Am I eligible for a grant?"],
    welcome: "Welcome to SUSI Student Support. I am your virtual assistant. How can I help you today?",
  },
];

export default function IndustryScenarios() {
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityLog, setSecurityLog] = useState([]);
  const [currentStatus, setCurrentStatus] = useState("idle");
  const [lastConfidence, setLastConfidence] = useState(null);

  function saveToHistory(prompt, is_injection, confidence, industryName) {
    const historyItem = {
      prompt: prompt,
      is_injection: is_injection,
      confidence: confidence,
      detection_layer: "all_layers",
      time: new Date().toLocaleTimeString(),
      id: Date.now(),
      source: industryName + " Demo"
    };
    const existing = JSON.parse(localStorage.getItem("detection_history") || "[]");
    localStorage.setItem("detection_history", JSON.stringify([historyItem, ...existing].slice(0, 500)));
  }

  function selectIndustry(industry) {
    setSelected(industry);
    setMessages([{ role: "bot", text: industry.welcome, blocked: false }]);
    setSecurityLog([]); setCurrentStatus("idle"); setInput("");
  }

  async function sendMessage() {
    if (!input.trim() || !selected) return;
    const currentInput = input;
    setMessages(p => [...p, { role: "user", text: input, blocked: false }]);
    setInput(""); setLoading(true); setCurrentStatus("checking");

    try {
      const r = await fetch(`${API}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentInput, industry: selected.id }),
      });
      const d = await r.json();

      if (d.blocked) {
        setCurrentStatus("blocked"); setLastConfidence(d.confidence);
        setSecurityLog(p => [{ time: new Date().toLocaleTimeString(), status: "BLOCKED", confidence: Math.round(d.confidence * 100), prompt: currentInput.slice(0, 45) + "..." }, ...p.slice(0, 9)]);
        saveToHistory(currentInput, true, d.confidence, selected.name);
        setMessages(p => [...p, { role: "bot", text: "Your message has been blocked by our security system. A prompt injection attack was detected. This incident has been logged.", blocked: true, confidence: d.confidence }]);
      } else {
        setCurrentStatus("safe"); setLastConfidence(null);
        setSecurityLog(p => [{ time: new Date().toLocaleTimeString(), status: "SAFE", confidence: 0, prompt: currentInput.slice(0, 45) + (currentInput.length > 45 ? "..." : "") }, ...p.slice(0, 9)]);
        saveToHistory(currentInput, false, 0, selected.name);
        setMessages(p => [...p, { role: "bot", text: d.ai_response, blocked: false }]);
      }
    } catch (e) {
      setCurrentStatus("idle");
      setMessages(p => [...p, { role: "bot", text: "Sorry I am unable to connect to the server.", blocked: false }]);
    }
    setLoading(false);
  }

  const totalBlocked = securityLog.filter(l => l.status === "BLOCKED").length;
  const totalSafe = securityLog.filter(l => l.status === "SAFE").length;

  if (!selected) {
    return (
      <div style={{ padding: 28, fontFamily: "'Segoe UI', sans-serif", background: "#0A0A0A", minHeight: "100vh" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>Multiple Industry <span style={{ color: "#C9A84C" }}>Scenarios</span></div>
        <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace", marginBottom: 32 }}>// Select an industry to see how the framework protects different AI chatbots</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          {INDUSTRIES.map(ind => (
            <div key={ind.id} onClick={() => selectIndustry(ind)}
              style={{ background: "#111111", border: "1px solid #222", borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${ind.accent}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = "1px solid #222"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: `linear-gradient(135deg, ${ind.color}, ${ind.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>{ind.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF" }}>{ind.name}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2, fontFamily: "monospace" }}>{ind.subtitle}</div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "monospace" }}>Example Questions</div>
                {ind.suggestions.slice(0, 2).map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#888", padding: "4px 0", borderBottom: "1px solid #1A1A1A" }}>{s}</div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: "rgba(0,196,154,0.15)", color: "#00C49A", fontFamily: "monospace" }}>3 Layers Active</span>
                  <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: 10, background: "rgba(201,168,76,0.15)", color: "#C9A84C", fontFamily: "monospace" }}>ChatGPT</span>
                </div>
                <div style={{ fontSize: 12, color: ind.accent, fontWeight: 700 }}>Launch Demo →</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "#111111", border: "1px solid #C9A84C", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A84C", marginBottom: 8, fontFamily: "monospace" }}>// Why Multiple Industries?</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.7 }}>My prompt injection detection framework protects any organisation using AI chatbots — banks, hospitals, universities and government services. This demonstrates the universal applicability of the framework across all industries in Ireland.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI', sans-serif", background: "#0A0A0A" }}>
      <div style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", color: "#FFFFFF", fontSize: 12, cursor: "pointer" }}>Back</button>
          <div style={{ background: "#FFFFFF", borderRadius: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 13, color: selected.color }}>{selected.icon}</div>
          <div>
            <div style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "bold" }}>{selected.name}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>{selected.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "5px 14px", color: "#FFFFFF", fontSize: 11, fontWeight: "bold" }}>3 Layer Security Active</div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "5px 14px", color: "rgba(255,255,255,0.8)", fontSize: 11 }}>Powered by ChatGPT</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "#111111", padding: "10px 24px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C49A", boxShadow: "0 0 6px #00C49A" }}></div>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#FFFFFF" }}>{selected.name} — Virtual Assistant</div>
            <div style={{ fontSize: 11, color: "#555", marginLeft: "auto", fontFamily: "monospace" }}>Protected by Prompt Injection Framework</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, color: "#FFFFFF", padding: "11px 16px", borderRadius: "18px 18px 4px 18px", maxWidth: "65%", fontSize: 13.5, lineHeight: 1.6 }}>{msg.text}</div>
                  </div>
                )}
                {msg.role === "bot" && !msg.blocked && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>{selected.icon.slice(0, 3)}</div>
                    <div style={{ background: "#111111", color: "#FFFFFF", padding: "11px 16px", borderRadius: "18px 18px 18px 4px", maxWidth: "65%", fontSize: 13.5, lineHeight: 1.6, border: "1px solid #222" }}>{msg.text}</div>
                  </div>
                )}
                {msg.role === "bot" && msg.blocked && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 34, height: 34, background: "rgba(255,68,68,0.2)", border: "1px solid #FF4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF4444", fontSize: 16, fontWeight: "bold", flexShrink: 0 }}>!</div>
                    <div style={{ background: "rgba(255,68,68,0.1)", color: "#FF8888", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", maxWidth: "68%", fontSize: 13.5, lineHeight: 1.6, border: "1px solid rgba(255,68,68,0.4)" }}>
                      <div style={{ fontWeight: "bold", fontSize: 11, marginBottom: 5, color: "#FF4444", fontFamily: "monospace" }}>SECURITY ALERT — Message Blocked</div>
                      <div>{msg.text}</div>
                      {msg.confidence && <div style={{ marginTop: 6, fontSize: 11, color: "#FF4444", fontWeight: "bold", fontFamily: "monospace" }}>Confidence: {Math.round(msg.confidence * 100)}%</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 10, fontWeight: "bold", flexShrink: 0 }}>{selected.icon.slice(0, 3)}</div>
                <div style={{ background: "#111111", color: "#666", padding: "11px 16px", borderRadius: "18px 18px 18px 4px", fontSize: 13, border: "1px solid #222", fontFamily: "monospace" }}>Assistant is typing...</div>
              </div>
            )}
          </div>

          <div style={{ padding: "8px 16px", background: "#111111", borderTop: "1px solid #222", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected.suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}>{s}</button>
            ))}
          </div>

          <div style={{ background: "#111111", borderTop: "1px solid #222", padding: "14px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} placeholder={`Type your message to ${selected.name}...`} style={{ flex: 1, padding: "11px 16px", border: "1px solid #333", borderRadius: 22, fontSize: 13.5, outline: "none", color: "#FFFFFF", background: "#1A1A1A" }} />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, color: "#FFFFFF", border: "none", borderRadius: 22, padding: "11px 24px", fontSize: 13.5, fontWeight: "bold", cursor: "pointer" }}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        <div style={{ width: 280, display: "flex", flexDirection: "column", background: "#111111", borderLeft: "1px solid #222" }}>
          <div style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.accent})`, padding: "13px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#FFFFFF" }}>Security Monitor</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, fontFamily: "monospace" }}>Prompt Injection Detection Framework</div>
          </div>
          <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
            {[{ label: "Checked", val: securityLog.length, color: "#C9A84C" }, { label: "Blocked", val: totalBlocked, color: "#FF4444" }, { label: "Safe", val: totalSafe, color: "#00C49A" }].map((stat, i) => (
              <div key={i} style={{ flex: 1, padding: "12px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid #222" : "none" }}>
                <div style={{ fontSize: 22, fontWeight: "bold", color: stat.color, fontFamily: "monospace" }}>{stat.val}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontFamily: "monospace" }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ margin: 12, padding: 12, borderRadius: 8, background: currentStatus === "blocked" ? "rgba(255,68,68,0.1)" : currentStatus === "safe" ? "rgba(0,196,154,0.1)" : currentStatus === "checking" ? "rgba(201,168,76,0.1)" : "#1A1A1A", border: `1px solid ${currentStatus === "blocked" ? "rgba(255,68,68,0.3)" : currentStatus === "safe" ? "rgba(0,196,154,0.3)" : currentStatus === "checking" ? "rgba(201,168,76,0.3)" : "#333"}` }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: currentStatus === "blocked" ? "#FF4444" : currentStatus === "safe" ? "#00C49A" : currentStatus === "checking" ? "#C9A84C" : "#555", marginBottom: 5, fontFamily: "monospace" }}>
              {currentStatus === "idle" && "// Awaiting Message"}
              {currentStatus === "checking" && "// Analysing..."}
              {currentStatus === "safe" && "// Message Safe"}
              {currentStatus === "blocked" && "// Attack Detected"}
            </div>
            <div style={{ fontSize: 10, color: "#555", lineHeight: 1.5, fontFamily: "monospace" }}>
              {currentStatus === "idle" && "All messages checked through 3 layers."}
              {currentStatus === "checking" && "Running Layer 1, Layer 2 and Layer 3..."}
              {currentStatus === "safe" && "All layers safe. Passed to ChatGPT."}
              {currentStatus === "blocked" && `Blocked with ${lastConfidence ? Math.round(lastConfidence * 100) : 0}% confidence.`}
            </div>
          </div>
          <div style={{ margin: "0 12px 12px", padding: 12, background: "#1A1A1A", borderRadius: 8, border: "1px solid #222" }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#C9A84C", marginBottom: 10, fontFamily: "monospace" }}>Detection Layers</div>
            {["Layer 1 — Rule-Based", "Layer 2 — BERT AI", "Layer 3 — LLM Guardrail"].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00C49A", boxShadow: "0 0 4px #00C49A", flexShrink: 0 }}></div>
                <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", flex: 1 }}>{l}</div>
                <div style={{ fontSize: 10, color: "#00C49A", fontFamily: "monospace" }}>Active</div>
              </div>
            ))}
          </div>
          <div style={{ margin: "0 12px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#C9A84C", marginBottom: 8, fontFamily: "monospace" }}>Detection Log</div>
            {securityLog.length === 0 && <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>No activity yet.</div>}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {securityLog.map((log, i) => (
                <div key={i} style={{ padding: "7px 9px", borderRadius: 6, marginBottom: 5, background: log.status === "BLOCKED" ? "rgba(255,68,68,0.1)" : "rgba(0,196,154,0.1)", border: `1px solid ${log.status === "BLOCKED" ? "rgba(255,68,68,0.25)" : "rgba(0,196,154,0.25)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "bold", fontSize: 10, color: log.status === "BLOCKED" ? "#FF4444" : "#00C49A", fontFamily: "monospace" }}>{log.status}</span>
                    <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>{log.time}</span>
                  </div>
                  {log.status === "BLOCKED" && <div style={{ fontSize: 10, color: "#FF4444", marginTop: 2, fontFamily: "monospace" }}>{log.confidence}% confidence</div>}
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{log.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}