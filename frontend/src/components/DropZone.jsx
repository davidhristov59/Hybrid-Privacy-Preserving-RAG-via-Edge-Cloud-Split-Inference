import { useState, useRef } from "react";
import { UploadIcon } from "./Icons";

export const DropZone = ({ onFiles, disabled }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(Array.from(e.target.files));
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer rounded-xl border border-dashed transition-all duration-200 ease-in-out
        flex flex-col items-center justify-center p-8 sm:p-10 text-center
        ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input ref={inputRef} type="file" accept=".pdf,.csv" multiple className="hidden" onChange={handleChange} />
      
      <div className={`p-3 rounded-full bg-secondary mb-4 transition-colors ${dragging ? "bg-primary/10" : "group-hover:bg-background"}`}>
        <UploadIcon size={20} className={dragging ? "text-primary" : "text-muted-foreground"} />
      </div>
      
      <h3 className="text-sm font-medium text-foreground mb-1">
        Upload Documents
      </h3>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        Drag & drop PDF or CSV files here, or click to browse
      </p>
    </div>
  );
};
