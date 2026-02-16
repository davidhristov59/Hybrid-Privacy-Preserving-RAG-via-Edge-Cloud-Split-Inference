export const StatCard = ({ label, value, accent = false }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
    <div className={`text-2xl font-semibold font-mono tracking-tight ${accent ? "text-foreground" : "text-foreground"}`}>
      {value}
    </div>
  </div>
);
