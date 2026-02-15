import { NavLink, useLocation } from "react-router-dom";
import { ShieldIcon, ChatIcon, FolderIcon, GridIcon } from "./Icons";

export const Sidebar = ({ stats }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { to: "/dashboard",      label: "Dashboard",      icon: <GridIcon size={16} /> },
    { to: "/chat",           label: "Secure Chat",    icon: <ChatIcon size={16} /> },
    { to: "/knowledge_base", label: "Knowledge Base", icon: <FolderIcon size={16} /> },
  ];

  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "var(--surface)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
      padding: "28px 0", flexShrink: 0,
    }}>
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--accent-dim)", border: "1px solid var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldIcon size={17} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font)", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", color: "var(--text)" }}>PRIV·RAG</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--text3)", letterSpacing: "0.1em" }}>EDGE-CLOUD SPLIT</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1 }}>
        {links.map(item => {
          const isActive = currentPath === item.to;
          return (
            <NavLink 
              key={item.to} 
              to={item.to} 
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 24px", background: isActive ? "var(--accent-dim)" : "none",
                border: "none", borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                color: isActive ? "var(--accent)" : "var(--text2)",
                fontSize: 13, fontFamily: "var(--font)", fontWeight: isActive ? 600 : 400,
                cursor: "pointer", transition: "all 0.2s", textAlign: "left", textDecoration: "none"
              }}
            >
              {item.icon}{item.label}
            </NavLink>
          )
        })}
      </nav>
      <div style={{ padding: "0 24px" }}>
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", letterSpacing: "0.08em" }}>VAULT ACTIVE</span>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text3)" }}>
            {stats ? `${stats.total_entities} entities masked` : "Loading..."}
          </div>
        </div>
      </div>
    </aside>
  );
};
