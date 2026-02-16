import { ShieldIcon } from "./Icons";
import { AuditPanel } from "./AuditPanel";

export const ChatMessage = ({ role, content, audit }) => {
  const isUser = role === "user";
  
  return (
    <div className={`flex flex-col gap-2 max-w-3xl ${isUser ? "items-end ml-auto" : "items-start mr-auto"}`}>
      <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`
          w-6 h-6 rounded-md flex items-center justify-center border text-[10px] font-bold
          ${isUser ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}
        `}>
          {isUser ? "U" : <ShieldIcon size={12} />}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {isUser ? "You" : "System"}
        </span>
      </div>

      <div className={`
        px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-full shadow-sm
        ${isUser 
          ? "bg-primary text-primary-foreground rounded-tr-sm" 
          : "bg-card border border-border text-card-foreground rounded-tl-sm"}
      `}>
        {content}
      </div>

      {!isUser && audit && (
        <div className="w-full max-w-[95%]">
          <AuditPanel maskedText={audit} />
        </div>
      )}
    </div>
  );
};
