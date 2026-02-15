import { useState } from "react";
import { ShieldIcon } from "./Icons";
import { AuditPanel } from "./AuditPanel";

export const ChatMessage = ({ role, content, audit }) => {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        {!isUser && (
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon size={11} color="var(--accent)" />
          </div>
        )}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {isUser ? "You" : "System"}
        </span>
      </div>
      <div style={{
        maxWidth: "78%", background: isUser ? "var(--surface3)" : "var(--surface2)",
        border: `1px solid ${isUser ? "var(--border2)" : "var(--border)"}`,
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        padding: "12px 16px", fontSize: 14, lineHeight: 1.7, color: "var(--text)", fontFamily: "var(--font)",
        ...(isUser ? { borderRight: "2px solid var(--accent2)" } : {}),
      }}>
        {content}
      </div>
      {!isUser && audit && <AuditPanel maskedText={audit} />}
    </div>
  );
};
