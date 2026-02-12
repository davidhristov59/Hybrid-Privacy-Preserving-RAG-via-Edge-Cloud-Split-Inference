import { useState, useEffect, useRef } from "react";

const API_BASE_URL = "http://localhost:8000";

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #080c10;
      --surface:   #0d1117;
      --s2:        #111820;
      --s3:        #161f2a;
      --border:    #1c2a38;
      --border2:   #243040;
      --accent:    #00e5ff;
      --accent2:   #0090a8;
      --accent-g:  rgba(0,229,255,.12);
      --accent-d:  rgba(0,229,255,.05);
      --green:     #00ff88;
      --green-d:   rgba(0,255,136,.08);
      --amber:     #ffc107;
      --amber-d:   rgba(255,193,7,.08);
      --red:       #ff4757;
      --red-d:     rgba(255,71,87,.08);
      --violet:    #b388ff;
      --violet-d:  rgba(179,136,255,.08);
      --text:      #deeaf2;
      --text2:     #7a9ab0;
      --text3:     #3d5568;
      --font:      'Syne', sans-serif;
      --mono:      'JetBrains Mono', monospace;
    }

    body { background: var(--bg); color: var(--text); font-family: var(--font); }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.35; } }
    @keyframes spin     { to { transform:rotate(360deg); } }
    @keyframes countUp  { from { opacity:0; transform:scale(.85); } to { opacity:1; transform:scale(1); } }
    @keyframes barGrow  { from { width:0; } to { width:var(--w); } }
    @keyframes ringFill { from { stroke-dashoffset: 283; } to { stroke-dashoffset: var(--offset); } }
    @keyframes scanline {
      0%   { top:-6px; opacity:.6; }
      100% { top:100%; opacity:0; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
async function apiFetch(path) {
  const r = await fetch(`${API_BASE_URL}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(2)} MB`;
}

function fmtName(s, max = 22) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/* ─────────────────────────────────────────────
   MINI ICONS
───────────────────────────────────────────── */
const Icon = ({ d, size = 16, stroke = "currentColor", sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  file:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
  grid:    "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  shield:  "M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z",
  tag:     "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  bar:     "M18 20V10 M12 20V4 M6 20v-6",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  clock:   "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z M12 6v6l4 2",
  layers:  "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
};

/* ─────────────────────────────────────────────
   RING CHART (donut)
───────────────────────────────────────────── */
function RingChart({ segments, size = 96, thickness = 14 }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.pct / 100) * circ;
    const gap  = circ - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
      {/* bg ring */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="var(--border)" strokeWidth={thickness} />
      {arcs.map((a, i) => (
        <circle key={i}
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={a.color} strokeWidth={thickness}
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={-a.offset}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   HORIZONTAL BAR
───────────────────────────────────────────── */
function HBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)" }}>{label}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color }}>
          {sub || value}
        </span>
      </div>
      <div style={{ height: 5, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, background: color, borderRadius: 4,
          transition: "width 1s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT TILE
───────────────────────────────────────────── */
function StatTile({ label, value, sub, color = "var(--accent)", icon, delay = 0 }) {
  return (
    <div style={{
      background: "var(--s2)", border: `1px solid var(--border)`,
      borderRadius: 12, padding: "20px 22px",
      animation: `fadeUp .5s ${delay}s ease both`,
      position: "relative", overflow: "hidden",
    }}>
      {/* glow corner */}
      <div style={{
        position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: color, opacity: 0.06,
        filter: "blur(20px)", pointerEvents: "none",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ color, opacity: 0.7 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 500, color, letterSpacing: "-0.03em", lineHeight: 1, animation: `countUp .6s ${delay + 0.1}s ease both`, opacity: 0 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ENTITY TYPE BADGE
───────────────────────────────────────────── */
const TYPE_META = {
  PERSON:   { color: "var(--accent)",  bg: "var(--accent-d)"  },
  ORG:      { color: "var(--green)",   bg: "var(--green-d)"   },
  LOC:      { color: "var(--amber)",   bg: "var(--amber-d)"   },
  EMAIL:    { color: "var(--violet)",  bg: "var(--violet-d)"  },
  PHONE:    { color: "var(--red)",     bg: "var(--red-d)"     },
  DATE:     { color: "#60c8ff",        bg: "rgba(96,200,255,.08)" },
  DEFAULT:  { color: "var(--text2)",   bg: "var(--s3)"        },
};

function EntityBadge({ type, count }) {
  const m = TYPE_META[type] || TYPE_META.DEFAULT;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 11px", borderRadius: 7,
      background: m.bg, border: `1px solid ${m.color}33`,
    }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: m.color, letterSpacing: "0.08em" }}>{type}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: m.color, fontWeight: 500 }}>{count}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SPARKLINE (tiny line chart)
───────────────────────────────────────────── */
function Sparkline({ data, color, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }} />
      {/* last point dot */}
      {(() => {
        const last = pts.split(" ").pop().split(",");
        return <circle cx={last[0]} cy={last[1]} r="3" fill={color} />;
      })()}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   DOCUMENT ROW
───────────────────────────────────────────── */
function DocRow({ doc, rank, maxSize, isSelected, onClick }) {
  const isCSV = doc.file_type === "csv";
  const typeColor = isCSV ? "var(--accent)" : "var(--red)";

  return (
    <div onClick={onClick} style={{
      display: "grid", gridTemplateColumns: "24px 1fr 70px 80px 90px",
      alignItems: "center", gap: 14,
      padding: "11px 16px", borderRadius: 9,
      background: isSelected ? "var(--accent-d)" : "transparent",
      border: `1px solid ${isSelected ? "var(--accent2)" : "transparent"}`,
      cursor: "pointer", transition: "all .15s",
    }}
      onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = "var(--s3)"; }}
      onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textAlign: "right" }}>
        {String(rank).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, overflow: "hidden" }}>
        <div style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 6,
          background: isCSV ? "var(--accent-d)" : "var(--red-d)",
          border: `1px solid ${typeColor}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--mono)", fontSize: 8, fontWeight: 700,
          color: typeColor, letterSpacing: ".04em",
        }}>
          {doc.file_type.toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {fmtName(doc.filename)}
        </span>
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", textAlign: "right" }}>
        {fmtBytes(doc.size_bytes)}
      </div>
      {/* mini size bar */}
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${maxSize > 0 ? (doc.size_bytes / maxSize) * 100 : 0}%`,
          background: typeColor, borderRadius: 2,
          transition: "width .8s ease",
        }} />
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", textAlign: "right" }}>
        {doc.path?.split("/").slice(-2, -1)[0] || "—"}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function DocumentDashboard() {
  const [docs, setDocs]   = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshAnim, setRefreshAnim] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        apiFetch("/documents"),
        apiFetch("/vault-stats"),
      ]);
      setDocs(d);
      setStats(s);
      if (d.length > 0) setSelected(d[0]);
    } catch {}
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { load(); }, []);

  const refresh = () => {
    setRefreshAnim(true);
    load().then(() => setTimeout(() => setRefreshAnim(false), 800));
  };

  /* ── derived stats ── */
  const totalSize   = docs.reduce((a, d) => a + d.size_bytes, 0);
  const pdfDocs     = docs.filter(d => d.file_type === "pdf");
  const csvDocs     = docs.filter(d => d.file_type === "csv");
  const maxSize     = docs.length ? Math.max(...docs.map(d => d.size_bytes)) : 1;
  const avgSize     = docs.length ? totalSize / docs.length : 0;

  const entityCounts  = stats?.entity_counts || {};
  const entityEntries = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]);
  const totalEntities = entityEntries.reduce((a, [, v]) => a + v, 0);

  /* donut segments */
  const typeSegments = [
    { label: "PDF", pct: docs.length ? (pdfDocs.length / docs.length) * 100 : 0, color: "var(--red)" },
    { label: "CSV", pct: docs.length ? (csvDocs.length / docs.length) * 100 : 0, color: "var(--accent)" },
  ];

  const entityColors = ["var(--accent)", "var(--green)", "var(--amber)", "var(--violet)", "var(--red)", "#60c8ff"];
  const entitySegments = entityEntries.slice(0, 5).map(([, v], i) => ({
    pct: totalEntities ? (v / totalEntities) * 100 : 0,
    color: entityColors[i % entityColors.length],
  }));

  /* fake sparkline: per-doc sizes sorted */
  const sizeSparkData = [...docs].sort((a, b) => a.size_bytes - b.size_bytes).map(d => d.size_bytes);

  if (loading) return (
    <>
      <Styles />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: 12, flexDirection: "column" }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"
          style={{ animation: "spin .8s linear infinite" }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: ".1em" }}>LOADING VAULT DATA</span>
      </div>
    </>
  );

  return (
    <>
      <Styles />
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "32px 36px", maxWidth: 1280, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, animation: "fadeUp .4s ease" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Icon d={icons.grid} size={18} stroke="var(--accent)" />
              <h1 style={{ fontFamily: "var(--font)", fontSize: 20, fontWeight: 800, letterSpacing: ".03em", color: "var(--text)" }}>
                Document Intelligence
              </h1>
            </div>
            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: ".08em" }}>
              KNOWLEDGE BASE · {docs.length} DOCUMENTS · {fmtBytes(totalSize)} TOTAL
            </p>
          </div>

          <button onClick={refresh} style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--s2)", border: "1px solid var(--border2)",
            borderRadius: 8, padding: "8px 14px",
            color: "var(--text2)", fontFamily: "var(--mono)", fontSize: 11,
            cursor: "pointer", letterSpacing: ".06em", transition: "all .2s",
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent2)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; }}
          >
            <Icon d={icons.refresh} size={13} stroke="currentColor"
              style={{ animation: refreshAnim ? "spin .6s linear" : "none" }} />
            REFRESH
          </button>
        </div>

        {/* ── TOP STAT TILES ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <StatTile label="Total Documents" value={docs.length} sub={`${pdfDocs.length} PDF · ${csvDocs.length} CSV`}
            color="var(--accent)" icon={<Icon d={icons.file} size={15} stroke="var(--accent)" />} delay={0} />
          <StatTile label="Vault Size" value={fmtBytes(totalSize)} sub={`avg ${fmtBytes(avgSize)}`}
            color="var(--green)" icon={<Icon d={icons.layers} size={15} stroke="var(--green)" />} delay={0.05} />
          <StatTile label="Masked Entities" value={totalEntities} sub={`${entityEntries.length} entity types`}
            color="var(--violet)" icon={<Icon d={icons.shield} size={15} stroke="var(--violet)" />} delay={0.1} />
          <StatTile label="Entity Types" value={entityEntries.length}
            sub={entityEntries[0] ? `top: ${entityEntries[0][0]}` : "—"}
            color="var(--amber)" icon={<Icon d={icons.tag} size={15} stroke="var(--amber)" />} delay={0.15} />
        </div>

        {/* ── MID ROW: Donut + Entity breakdown + Sparkline ── */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px", gap: 14, marginBottom: 24 }}>

          {/* File type donut */}
          <div style={{
            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
            animation: "fadeUp .5s .2s ease both",
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: ".1em", textTransform: "uppercase" }}>
              File Types
            </div>
            <div style={{ position: "relative" }}>
              <RingChart segments={docs.length ? typeSegments : [{ pct: 100, color: "var(--border)" }]} size={100} thickness={12} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{docs.length}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".06em" }}>DOCS</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              {typeSegments.map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)" }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: s.color }}>
                    {s.label === "PDF" ? pdfDocs.length : csvDocs.length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Entity breakdown */}
          <div style={{
            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px",
            animation: "fadeUp .5s .25s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: ".1em" }}>ENTITY BREAKDOWN</div>
              <RingChart segments={entitySegments.length ? entitySegments : [{ pct: 100, color: "var(--border)" }]} size={36} thickness={5} />
            </div>
            {entityEntries.length === 0 ? (
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", textAlign: "center", paddingTop: 16 }}>
                No entities yet
              </div>
            ) : (
              entityEntries.map(([type, count], i) => (
                <HBar key={type} label={type} value={count} max={entityEntries[0][1]}
                  color={entityColors[i % entityColors.length]}
                  sub={`${count} · ${totalEntities ? Math.round(count / totalEntities * 100) : 0}%`} />
              ))
            )}
          </div>

          {/* Size sparkline */}
          <div style={{
            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px",
            display: "flex", flexDirection: "column", gap: 12,
            animation: "fadeUp .5s .3s ease both",
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: ".1em" }}>SIZE PROFILE</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {sizeSparkData.length >= 2
                ? <Sparkline data={sizeSparkData} color="var(--green)" width={130} height={52} />
                : <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)" }}>need 2+ docs</span>
              }
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", marginBottom: 3 }}>SMALLEST</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)" }}>
                  {docs.length ? fmtBytes(Math.min(...docs.map(d => d.size_bytes))) : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", marginBottom: 3 }}>LARGEST</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--amber)" }}>
                  {docs.length ? fmtBytes(maxSize) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Doc Table + Detail Panel ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>

          {/* Document table */}
          <div style={{
            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 12,
            overflow: "hidden", animation: "fadeUp .5s .35s ease both",
          }}>
            {/* table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "24px 1fr 70px 80px 90px",
              gap: 14, padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--s3)",
            }}>
              {["#", "FILENAME", "SIZE", "RELATIVE", "DIR"].map((h, i) => (
                <div key={h} style={{
                  fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em",
                  textAlign: i >= 2 ? "right" : "left",
                }}>{h}</div>
              ))}
            </div>

            {docs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
                No documents indexed yet.
              </div>
            ) : (
              <div style={{ padding: "8px" }}>
                {docs.map((doc, i) => (
                  <DocRow key={doc.filename} doc={doc} rank={i + 1}
                    maxSize={maxSize} isSelected={selected?.filename === doc.filename}
                    onClick={() => setSelected(doc)} />
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div style={{
            background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px",
            animation: "fadeUp .5s .4s ease both",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {selected ? (
              <>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em", marginBottom: 8 }}>
                    SELECTED DOCUMENT
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", wordBreak: "break-all", lineHeight: 1.4 }}>
                    {selected.filename}
                  </div>
                </div>

                {/* type badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: 6,
                  background: selected.file_type === "csv" ? "var(--accent-d)" : "var(--red-d)",
                  border: `1px solid ${selected.file_type === "csv" ? "var(--accent2)" : "var(--red)"}33`,
                  alignSelf: "flex-start",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: selected.file_type === "csv" ? "var(--accent)" : "var(--red)" }} />
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: selected.file_type === "csv" ? "var(--accent)" : "var(--red)", letterSpacing: ".08em" }}>
                    {selected.file_type.toUpperCase()} FILE
                  </span>
                </div>

                {/* meta rows */}
                {[
                  { label: "File Size",  value: fmtBytes(selected.size_bytes) },
                  { label: "Raw Path",   value: selected.path },
                  { label: "Type",       value: selected.file_type.toUpperCase() },
                ].map(row => (
                  <div key={row.label} style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em", marginBottom: 4 }}>
                      {row.label}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text2)", wordBreak: "break-all", lineHeight: 1.5 }}>
                      {row.value}
                    </div>
                  </div>
                ))}

                {/* share of total */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em", marginBottom: 8 }}>
                    SIZE SHARE
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${totalSize ? (selected.size_bytes / totalSize) * 100 : 0}%`,
                        background: selected.file_type === "csv" ? "var(--accent)" : "var(--red)",
                        transition: "width .8s ease",
                      }} />
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text2)", flexShrink: 0 }}>
                      {totalSize ? `${((selected.size_bytes / totalSize) * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>

                {/* entity types */}
                {entityEntries.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em", marginBottom: 10 }}>
                      VAULT ENTITY TYPES
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {entityEntries.map(([type, count], i) => (
                        <EntityBadge key={type} type={type} count={count} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: .4 }}>
                <Icon d={icons.file} size={28} stroke="var(--text3)" />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>Select a document</span>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", animation: "fadeIn .8s ease" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: ".1em" }}>
            LAST SYNC · {lastRefresh.toLocaleTimeString()}
          </span>
        </div>

      </div>
    </>
  );
}
