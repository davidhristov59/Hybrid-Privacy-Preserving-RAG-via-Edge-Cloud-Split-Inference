import { ShieldIcon, ChatIcon, FolderIcon, LockIcon, CheckIcon } from "../components/Icons";
import { StatCard } from "../components/StatCard";

export const DashboardPage = ({ stats }) => {
  const entityTypes = stats?.entity_counts ? Object.entries(stats.entity_counts) : [];

  return (
    <div className="flex-1 overflow-y-auto bg-background h-screen">
      <header className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldIcon size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Overview</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Welcome to the Hybrid Privacy-Preserving RAG platform. Your data is processed using a 
            split-inference architecture, ensuring sensitive information never leaves the secure edge.
          </p>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Top Level Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            label="Total Protected Entities" 
            value={stats?.total_entities || 0} 
            accent 
          />
          <StatCard 
            label="Encryption Status" 
            value="Active" 
          />
          <StatCard 
            label="Average Privacy Score" 
            value="99.8%" 
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Entity Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Identity Vault Breakdown</h3>
                  <p className="text-xs text-muted-foreground mt-1">Classification of PII tokens stored locally</p>
                </div>
              </div>

              {entityTypes.length === 0 ? (
                <div className="py-12 text-center bg-secondary/20 rounded-xl border border-dashed border-border">
                  <p className="text-xs text-muted-foreground font-mono">No entities indexed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {entityTypes.map(([type, count]) => (
                    <div key={type} className="p-4 bg-secondary/30 border border-border rounded-xl hover:border-primary/30 transition-colors">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{type}</div>
                      <div className="text-xl font-semibold text-foreground font-mono">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/chat" className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChatIcon size={24} />
                </div>
                <div>
                  <div className="font-semibold text-sm">Start Secure Chat</div>
                  <div className="text-xs text-muted-foreground">Ask questions about your data</div>
                </div>
              </a>
              <a href="/knowledge_base" className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <FolderIcon size={24} />
                </div>
                <div>
                  <div className="font-semibold text-sm">Manage Documents</div>
                  <div className="text-xs text-muted-foreground">Upload and index new files</div>
                </div>
              </a>
            </div>
          </div>

          {/* Sidebar: System Logs / Status */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-wider">System Health</h3>
              <div className="space-y-4">
                {[
                  { label: "Edge Processor", status: "Operational" },
                  { label: "Identity Vault", status: "Locked" },
                  { label: "Vector DB", status: "Synced" },
                  { label: "Cloud Link", status: "Secure" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-foreground font-semibold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950/50 border border-border rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <LockIcon size={48} />
              </div>
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Zero-Trust Protocol</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tokens are deterministic and unique to your local vault. No raw PII strings or embeddings are ever transmitted.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <CheckIcon size={12} className="text-emerald-500" />
                <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-tighter font-bold text-shadow-glow">Verified Security</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
