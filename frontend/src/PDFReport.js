import { useState } from "react";

export default function PDFReport() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function generateReport() {
    setGenerating(true);
    const history = JSON.parse(localStorage.getItem("detection_history") || "[]");
    const totalAttacks = parseInt(localStorage.getItem("total_attacks") || "0");

    const injections = history.filter(h => h.is_injection);
    const safe = history.filter(h => !h.is_injection);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<title>PID Framework Security Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #1B3A6B; border-bottom: 3px solid #1B3A6B; padding-bottom: 10px; }
  h2 { color: #1B3A6B; margin-top: 30px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
  .stat-card { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-num { font-size: 32px; font-weight: bold; color: #1B3A6B; }
  .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1B3A6B; color: white; padding: 10px; text-align: left; font-size: 12px; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
  tr:nth-child(even) { background: #f8f9fa; }
  .injection { color: #dc3545; font-weight: bold; }
  .safe { color: #28a745; font-weight: bold; }
  .header-info { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
  .layer-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
  .bar-container { background: #eee; border-radius: 4px; height: 12px; width: 200px; overflow: hidden; display: inline-block; margin-left: 10px; vertical-align: middle; }
  .bar-fill { height: 100%; border-radius: 4px; }
</style>
</head>
<body>
<h1>PID Framework — Security Report</h1>
<div class="header-info">
  <strong>Project:</strong> Design and Evaluation of a Prompt Injection Detection Framework<br/>
  <strong>Student:</strong> Bindu Priya Vadlamudi &nbsp;|&nbsp; <strong>Student No:</strong> 3159626<br/>
  <strong>College:</strong> Griffith College Dublin &nbsp;|&nbsp; <strong>Supervisor:</strong> Arman<br/>
  <strong>Generated:</strong> ${new Date().toLocaleString()}
</div>

<h2>Summary Statistics</h2>
<div class="stat-grid">
  <div class="stat-card">
    <div class="stat-num">${history.length}</div>
    <div class="stat-label">Total Prompts Tested</div>
  </div>
  <div class="stat-card">
    <div class="stat-num" style="color:#dc3545">${injections.length}</div>
    <div class="stat-label">Injection Attacks Blocked</div>
  </div>
  <div class="stat-card">
    <div class="stat-num" style="color:#28a745">${safe.length}</div>
    <div class="stat-label">Safe Prompts Allowed</div>
  </div>
  <div class="stat-card">
    <div class="stat-num">${history.length > 0 ? Math.round(injections.length / history.length * 100) : 0}%</div>
    <div class="stat-label">Attack Rate</div>
  </div>
</div>

<h2>Evaluation Results</h2>
<table>
  <tr>
    <th>Layer</th>
    <th>Accuracy</th>
    <th>Precision</th>
    <th>Recall</th>
    <th>F1 Score</th>
    <th>False Positive</th>
  </tr>
  <tr>
    <td>Layer 1 — Rule-Based</td>
    <td>75%</td><td>100%</td><td>50%</td><td>66.7%</td><td>0%</td>
  </tr>
  <tr>
    <td>Layer 2 — BERT Classifier</td>
    <td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>0%</td>
  </tr>
  <tr>
    <td>Layer 3 — LLM Guardrail</td>
    <td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>0%</td>
  </tr>
  <tr style="background:#e8f5e9; font-weight:bold">
    <td>All Combined</td>
    <td>100%</td><td>100%</td><td>100%</td><td>100%</td><td>0%</td>
  </tr>
</table>

<h2>Detection History — Last ${Math.min(history.length, 50)} Records</h2>
<table>
  <tr>
    <th>#</th>
    <th>Time</th>
    <th>Prompt</th>
    <th>Source</th>
    <th>Result</th>
    <th>Confidence</th>
  </tr>
  ${history.slice(0, 50).map((h, i) => `
  <tr>
    <td>${i + 1}</td>
    <td>${h.time || ""}</td>
    <td>${(h.prompt || "").slice(0, 60)}${(h.prompt || "").length > 60 ? "..." : ""}</td>
    <td>${h.source || "Detect Page"}</td>
    <td class="${h.is_injection ? "injection" : "safe"}">${h.is_injection ? "INJECTION" : "SAFE"}</td>
    <td>${Math.round((h.confidence || 0) * 100)}%</td>
  </tr>
  `).join("")}
</table>

<br/><br/>
<div style="text-align:center; color:#999; font-size:11px; border-top:1px solid #eee; padding-top:16px;">
  PID Framework — Griffith College Dublin MSc Project — Bindu Priya Vadlamudi — 3159626
</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PID_Security_Report_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setGenerating(false);
    setGenerated(true);
    setTimeout(() => setGenerated(false), 3000);
  }

  const history = JSON.parse(localStorage.getItem("detection_history") || "[]");
  const injections = history.filter(h => h.is_injection);
  const safe = history.filter(h => !h.is_injection);

  return (
    <div style={{ padding: 28, fontFamily: "'Segoe UI', sans-serif", background: "#0A0A0A", minHeight: "100vh" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>
        PDF Report <span style={{ color: "#C9A84C" }}>Generator</span>
      </div>
      <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace", marginBottom: 24 }}>
        // Generate a professional security report of all detection activity
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Tested", val: history.length, color: "#C9A84C" },
          { label: "Attacks Blocked", val: injections.length, color: "#FF4444" },
          { label: "Safe Prompts", val: safe.length, color: "#00C49A" },
          { label: "Attack Rate", val: history.length > 0 ? Math.round(injections.length / history.length * 100) + "%" : "0%", color: "#4488FF" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#111111", border: "1px solid #222", borderTop: `3px solid ${s.color}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "monospace" }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A84C", marginBottom: 16, fontFamily: "monospace" }}>// Report Contents</div>
          {[
            "Project information and student details",
            "Summary statistics — total tested, blocked, safe",
            "Full evaluation results for all 3 layers",
            "Accuracy, Precision, Recall, F1 Score table",
            "Complete detection history — last 50 records",
            "Timestamp and confidence scores for each detection",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C49A", flexShrink: 0 }}></div>
              <div style={{ fontSize: 12, color: "#888" }}>{item}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A84C", marginBottom: 16, fontFamily: "monospace" }}>// How to Use</div>
          {[
            { n: "1", t: "Click Generate Report button below" },
            { n: "2", t: "HTML file downloads automatically to your Mac" },
            { n: "3", t: "Open the file in any browser" },
            { n: "4", t: "Press Cmd + P to print or save as PDF" },
            { n: "5", t: "Share the PDF report with your professor" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#C9A84C", flexShrink: 0, fontFamily: "monospace" }}>{s.n}</div>
              <div style={{ fontSize: 12, color: "#888", paddingTop: 3 }}>{s.t}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>Generate Security Report</div>
        <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace", marginBottom: 20 }}>
          Report will include {history.length} detection records and full evaluation results
        </div>
        <button onClick={generateReport} disabled={generating} style={{ padding: "14px 40px", background: generated ? "rgba(0,196,154,0.2)" : "linear-gradient(135deg,#C9A84C,#F5D76E)", color: generated ? "#00C49A" : "#0A0A0A", border: generated ? "1px solid #00C49A" : "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Segoe UI', sans-serif", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}>
          {generating ? "Generating..." : generated ? "Report Downloaded!" : "Generate and Download Report"}
        </button>
      </div>
    </div>
  );
}