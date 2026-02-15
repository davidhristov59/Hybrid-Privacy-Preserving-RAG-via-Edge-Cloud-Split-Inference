export const StatCard = ({ label, value, accent = false }) => (
  <div style={{
    background: accent ? "var(--accent-dim)" : "var(--surface2)",
    border: `1px solid ${accent ? "var(--accent2)" : "var(--border)"}`,
    borderRadius: 10, padding: "18px 22px", animation: "fadeUp 0.4s ease both",
  }}>
    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 500, color: accent ? "var(--accent)" : "var(--text)", letterSpacing: "-0.02em" }}>{value}</div>
  </div>
);
