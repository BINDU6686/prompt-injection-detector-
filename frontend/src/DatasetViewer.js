import { useState, useEffect } from "react";

export default function DatasetViewer() {
  const [prompts, setPrompts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

  useEffect(() => {
    fetch("/dataset.csv")
      .then(r => r.text())
      .then(text => {
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",");
        const data = lines.slice(1).map(line => {
          const parts = line.split(",");
          return {
            prompt: parts[0] ? parts[0].replace(/"/g, "") : "",
            label: parts[1] ? parts[1].replace(/"/g, "") : "",
            category: parts[2] ? parts[2].replace(/"/g, "") : "",
          };
        });
        setPrompts(data);
        setFiltered(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error loading dataset:", e);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = prompts;
    if (filter !== "all") result = result.filter(p => p.label === filter);
    if (category !== "all") result = result.filter(p => p.category === category);
    if (search.trim()) result = result.filter(p => p.prompt.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
    setPage(1);
  }, [search, filter, category, prompts]);

  const categories = ["all", ...new Set(prompts.map(p => p.category).filter(Boolean))];
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const injectionCount = prompts.filter(p => p.label === "injection").length;
  const safeCount = prompts.filter(p => p.label === "safe").length;

  return (
    <div style={{ padding: 28, fontFamily: "'Segoe UI', sans-serif", background: "#0A0A0A", minHeight: "100vh" }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>
        Dataset <span style={{ color: "#C9A84C" }}>Viewer</span>
      </div>
      <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace", marginBottom: 24 }}>
        // Complete evaluation dataset — {prompts.length} labelled prompts across 6 attack categories
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Prompts", val: prompts.length, color: "#C9A84C" },
          { label: "Injection Attacks", val: injectionCount, color: "#FF4444" },
          { label: "Safe Prompts", val: safeCount, color: "#00C49A" },
          { label: "Attack Categories", val: categories.length - 1, color: "#4488FF" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#111111", border: "1px solid #222", borderTop: `3px solid ${stat.color}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "monospace" }}>{stat.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>Search Prompts</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search any prompt..."
              style={{ width: "100%", padding: "10px 14px", background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, fontSize: 13, color: "#FFFFFF", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>Filter by Label</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, fontSize: 13, color: "#FFFFFF", outline: "none", fontFamily: "monospace" }}>
              <option value="all">All Labels</option>
              <option value="injection">Injection Only</option>
              <option value="safe">Safe Only</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>Filter by Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, fontSize: 13, color: "#FFFFFF", outline: "none", fontFamily: "monospace" }}>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c === "all" ? "All Categories" : c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#666", fontFamily: "monospace" }}>
          Showing {filtered.length} of {prompts.length} prompts
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666", fontFamily: "monospace" }}>Loading dataset...</div>
        ) : currentItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666", fontFamily: "monospace" }}>No prompts found matching your search.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Prompt", "Label", "Category"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", background: "#1A1A1A", borderBottom: "1px solid #222", fontFamily: "monospace" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1A1A1A" }}>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#444", fontFamily: "monospace", width: 50 }}>
                    {(page - 1) * itemsPerPage + i + 1}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#CCC", maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.prompt}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: item.label === "injection" ? "rgba(255,68,68,0.15)" : "rgba(0,196,154,0.15)", color: item.label === "injection" ? "#FF4444" : "#00C49A" }}>
                      {item.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: "rgba(201,168,76,0.15)", color: "#C9A84C" }}>
                      {item.category ? item.category.replace(/_/g, " ") : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "8px 16px", background: page === 1 ? "#1A1A1A" : "#C9A84C", color: page === 1 ? "#444" : "#0A0A0A", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: page === 1 ? "not-allowed" : "pointer", fontFamily: "monospace" }}>Previous</button>
          <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>Page {page} of {totalPages}</div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "8px 16px", background: page === totalPages ? "#1A1A1A" : "#C9A84C", color: page === totalPages ? "#444" : "#0A0A0A", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: page === totalPages ? "not-allowed" : "pointer", fontFamily: "monospace" }}>Next</button>
        </div>
      )}
    </div>
  );
}