import { useRef, useState } from "react";

export default function Dropzone({ label, hint, multiple, thumbs, onFiles, extra }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(files) {
    const list = Array.from(files || []).filter(f => f.type.startsWith("image/"));
    if (list.length) onFiles(list);
  }

  return (
    <div className="field" data-for={multiple ? "team" : "pfp,id"}>
      <label>{label}</label>
      <div
        className={`dropzone${dragOver ? " drag-over" : ""}`}
        tabIndex={0}
        role="button"
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files); }}
      >
        {!thumbs && (
          <div className="dropzone-idle">
            <span className="dropzone-icon">⤒</span>
            <span className="dropzone-text">{hint}</span>
          </div>
        )}
        {thumbs}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={e => pick(e.target.files)}
      />
      {extra}
    </div>
  );
}
