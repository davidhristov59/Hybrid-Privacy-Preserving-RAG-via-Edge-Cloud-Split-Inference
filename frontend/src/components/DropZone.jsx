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
    <div onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`,
        borderRadius: 12, padding: "36px 24px", textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        background: dragging ? "var(--accent-dim)" : "var(--surface2)",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}>
      <input ref={inputRef} type="file" accept=".pdf,.csv" multiple style={{ display: "none" }} onChange={handleChange} />
      <div style={{ marginBottom: 10 }}>
        <UploadIcon size={28} color={dragging ? "var(--accent)" : "var(--text3)"} />
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text2)", letterSpacing: "0.06em" }}>
        DROP FILES HERE (PDF, CSV)
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text3)", marginTop: 6 }}>
        or click to browse · Max 10 files
      </div>
    </div>
  );
};
