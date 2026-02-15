import { useState } from "react";
import { LockIcon, EyeIcon, CheckIcon } from "./Icons";

export const AuditPanel = ({ maskedText }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none",
        border: "1px solid var(--border)", borderRadius: 6, color: "var(--text3)",
        fontFamily: "var(--mono)", fontSize: 11, padding: "5px 10px",
        cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.06em",
      }}
        onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent2)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}
      >
        <LockIcon size={12} />{open ? "HIDE" : "VIEW"} PRIVACY AUDIT
      </button>
      {open && (
        <div style={{
          marginTop: 8, background: "var(--bg)", border: "1px solid var(--border2)",
          borderLeft: "2px solid var(--accent2)", borderRadius: "0 8px 8px 0",
          padding: "14px 16px", animation: "fadeUp 0.25s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <EyeIcon size={13} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)", letterSpacing: "0.08em" }}>WHAT THE CLOUD SAW</span>
          </div>
          <pre style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, margin: 0 }}>
            {maskedText || "(no context captured)"}
          </pre>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12 }}>
            <CheckIcon size={13} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)", letterSpacing: "0.06em" }}>PII REDACTED BEFORE TRANSMISSION</span>
          </div>
        </div>
      )}
    </div>
  );
};
