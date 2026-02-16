import { NavLink } from "react-router-dom";
import { ShieldIcon, ChatIcon, FolderIcon, GridIcon, ActivityIcon } from "./Icons";

export const Sidebar = ({ stats }) => {
  const links = [
    { to: "/dashboard",      label: "Overview",       icon: <GridIcon size={16} /> },
    { to: "/chat",           label: "Secure Chat",    icon: <ChatIcon size={16} /> },
    { to: "/knowledge_base", label: "Documents",      icon: <FolderIcon size={16} /> },
    { to: "/evaluate",       label: "Evaluation",     icon: <ActivityIcon size={16} /> },
  ];

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <ShieldIcon size={16} color="currentColor" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-foreground">SplitRAG</div>
            <div className="text-[10px] text-muted-foreground tracking-wider font-medium">ENTERPRISE SECURITY</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 space-y-1">
        <div className="px-3 text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Platform</div>
        {links.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group ${
                isActive 
                  ? "bg-secondary text-foreground shadow-sm ring-1 ring-white/5" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-border">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-500 font-medium tracking-wide">VAULT ACTIVE</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            <span className="text-foreground font-mono">{stats?.total_entities || 0}</span> entities masked
          </div>
        </div>
      </div>
    </aside>
  );
};
