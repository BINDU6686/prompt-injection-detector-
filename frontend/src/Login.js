import { useState } from "react";

const USERS = [
  { username: "bindu3129", password: "Griffith@156", role: "Researcher" },
  { username: "arman", password: "supervisor123", role: "Supervisor" },
  { username: "demo", password: "demo123", role: "Demo User" },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");

    setTimeout(() => {
      const user = USERS.find(u => u.username === username && u.password === password);
      if (user) {
        onLogin(user);
      } else {
        setError("Invalid username or password. Please try again.");
        setLoading(false);
      }
    }, 1000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 1px 1px, #1A1A1A 1px, transparent 0)", backgroundSize: "40px 40px", opacity: 0.5 }}></div>

      <div style={{ position: "relative", width: 420, padding: 40, background: "#111111", border: "1px solid #222", borderRadius: 20, boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#C9A84C,#F5D76E)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(201,168,76,0.4)" }}>
            <span style={{ fontSize: 28 }}>🛡</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>PID Framework</div>
          <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>Prompt Injection Detection System</div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", marginTop: 4 }}>Secure Login Required</div>
        </div>

        {error && (
          <div style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#FF4444", fontFamily: "monospace" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>Username</label>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setError(""); }}
            onKeyPress={e => e.key === "Enter" && handleLogin()}
            placeholder="Enter username"
            style={{ width: "100%", padding: "12px 16px", background: "#1A1A1A", border: "1px solid #333", borderRadius: 10, fontSize: 14, color: "#FFFFFF", outline: "none", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyPress={e => e.key === "Enter" && handleLogin()}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              style={{ width: "100%", padding: "12px 44px 12px 16px", background: "#1A1A1A", border: "1px solid #333", borderRadius: 10, fontSize: 14, color: "#FFFFFF", outline: "none", fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box" }}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: 14, background: loading ? "#333" : "linear-gradient(135deg,#C9A84C,#F5D76E)", color: loading ? "#666" : "#0A0A0A", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Segoe UI', sans-serif", boxShadow: loading ? "none" : "0 4px 20px rgba(201,168,76,0.35)" }}
        >
          {loading ? "Authenticating..." : "Login to Dashboard"}
        </button>

        <div style={{ marginTop: 24, padding: 16, background: "#1A1A1A", borderRadius: 10, border: "1px solid #333" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#C9A84C", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>Available Accounts</div>
          {USERS.map((u, i) => (
            <div key={i} onClick={() => { setUsername(u.username); setPassword(u.password); setError(""); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < USERS.length - 1 ? "1px solid #222" : "none", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <div>
                <span style={{ fontSize: 11, color: "#FFFFFF", fontFamily: "monospace" }}>{u.username}</span>
                <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}> / {u.password}</span>
              </div>
              <span style={{ fontSize: 10, color: "#C9A84C", fontFamily: "monospace" }}>{u.role}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#444", marginTop: 8, fontFamily: "monospace" }}>Click any row to auto-fill credentials</div>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, color: "#333", fontFamily: "monospace" }}>
          MSc Computing Science — Griffith College Dublin — Supervisor: Arman
        </div>
      </div>
    </div>
  );
}