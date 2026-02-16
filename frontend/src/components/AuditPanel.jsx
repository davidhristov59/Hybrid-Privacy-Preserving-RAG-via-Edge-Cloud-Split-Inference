import { useState } from "react";
import { LockIcon, EyeIcon, CheckIcon } from "./Icons";

export const AuditPanel = ({ maskedText }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="mt-3">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider bg-secondary/30 hover:bg-secondary px-2 py-1 rounded border border-transparent hover:border-border"
      >
        <LockIcon size={10} />
        {open ? "Hide Privacy Audit" : "View Privacy Audit"}
      </button>
      
      {open && (
        <div className="mt-2 bg-secondary/30 border border-border rounded-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 border-b border-border">
            <EyeIcon size={12} className="text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground font-medium">CLOUD_PAYLOAD_PREVIEW</span>
          </div>
          <div className="p-3 bg-zinc-950/50">
            <pre className="font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
              {maskedText || "// No context captured"}
            </pre>
          </div>
          <div className="px-3 py-2 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center gap-2">
            <CheckIcon size={12} className="text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-500">PII Redacted Successfully</span>
          </div>
        </div>
      )}
    </div>
  );
};
