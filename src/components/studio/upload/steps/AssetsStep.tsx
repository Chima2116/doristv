"use client";

import { useRef, useState } from "react";
import { ASSET_DEFS, AssetKey, AssetSlot } from "@/lib/uploadTypes";
import { StepHeader, bytesToSize } from "../ui";

function UploadIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v13" /></svg>;
}
function FileIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
}

function Dropzone({ assetKey, slot, onFile, onRemove }: { assetKey: AssetKey; slot: AssetSlot; onFile: (f: File) => void; onRemove: () => void }) {
  const def = ASSET_DEFS.find((d) => d.key === assetKey)!;
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  const isSubtitle = def.kind === "subtitle";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{def.label}{!def.required && <span style={{ color: "var(--text-tertiary)", fontWeight: 600 }}> · Optional</span>}</span>
        {slot.status === "done" && (
          <button onClick={onRemove} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: 0 }}>Replace</button>
        )}
      </div>
      <span style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: -6 }}>{def.hint}</span>

      <input ref={inputRef} type="file" accept={def.accept} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      {isSubtitle ? (
        <button
          onClick={pick}
          style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 64, padding: "0 20px", borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-ui)", background: "var(--surface-1)", border: "1px dashed var(--border-strong)", color: "var(--text-primary)" }}
        >
          <span style={{ width: 36, height: 36, flex: "none", borderRadius: 8, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><FileIcon /></span>
          {slot.status === "done" ? (
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700 }}>{slot.fileName}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--success)", fontFamily: "var(--font-mono)", marginTop: 1 }}>{bytesToSize(slot.fileSize || 0)} · attached ✓</span>
            </span>
          ) : (
            <span style={{ fontSize: 13.5, color: "var(--text-tertiary)" }}>Tap to choose a .srt or .vtt file</span>
          )}
        </button>
      ) : (
        <div
          onClick={slot.status === "empty" ? pick : undefined}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            position: "relative", width: "100%", aspectRatio: def.aspect, borderRadius: "var(--radius-lg)", overflow: "hidden",
            cursor: slot.status === "empty" ? "pointer" : "default",
            border: "1px " + (dragOver ? "solid var(--accent)" : "dashed var(--border-strong)"),
            background: dragOver ? "var(--accent-subtle)" : "var(--surface-1)",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 150ms var(--ease-standard)",
          }}
        >
          {slot.status === "empty" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--text-tertiary)", padding: 20, textAlign: "center" }}>
              <UploadIcon />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-secondary)" }}>Drag & drop, or tap to browse</span>
              <span style={{ fontSize: 11.5 }}>{def.kind === "video" ? "MP4 or MOV" : "JPG or PNG"}</span>
            </div>
          )}

          {slot.status !== "empty" && def.kind === "image" && slot.objectUrl && (
            <img src={slot.objectUrl} alt={def.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {slot.status !== "empty" && def.kind === "video" && slot.objectUrl && (
            <video src={slot.objectUrl} muted loop playsInline autoPlay style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}

          {slot.status === "uploading" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(11,12,14,.7)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#fff" }}>{Math.round(slot.progress)}%</span>
              <div style={{ width: "60%", height: 4, borderRadius: 999, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${slot.progress}%`, background: "#fff", borderRadius: 999, transition: "width 200ms linear" }} />
              </div>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>Uploading {slot.fileName}</span>
            </div>
          )}

          {slot.status === "done" && (
            <span style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, color: "#fff", background: "rgba(11,12,14,.7)", backdropFilter: "blur(6px)", borderRadius: 8, padding: "6px 10px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              {slot.fileName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function AssetsStep({ assets, onFile, onRemove }: { assets: Record<AssetKey, AssetSlot>; onFile: (key: AssetKey, file: File) => void; onRemove: (key: AssetKey) => void }) {
  const required = ASSET_DEFS.filter((d) => d.required);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 2 of 9" title="Upload your assets" sub="Real files, real previews. Drop them in below — poster and backdrop shape how your film looks everywhere on DORIS." />

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.7fr", gap: 28, marginBottom: 40 }}>
        <Dropzone assetKey="master" slot={assets.master} onFile={(f) => onFile("master", f)} onRemove={() => onRemove("master")} />
        <Dropzone assetKey="poster" slot={assets.poster} onFile={(f) => onFile("poster", f)} onRemove={() => onRemove("poster")} />
      </div>
      <div style={{ marginBottom: 40 }}>
        <Dropzone assetKey="backdrop" slot={assets.backdrop} onFile={(f) => onFile("backdrop", f)} onRemove={() => onRemove("backdrop")} />
      </div>

      <div style={{ height: 1, background: "var(--border-subtle)", margin: "8px 0 36px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        <Dropzone assetKey="trailer" slot={assets.trailer} onFile={(f) => onFile("trailer", f)} onRemove={() => onRemove("trailer")} />
        <Dropzone assetKey="subtitles" slot={assets.subtitles} onFile={(f) => onFile("subtitles", f)} onRemove={() => onRemove("subtitles")} />
      </div>

      {required.some((d) => assets[d.key].status !== "done") && (
        <p style={{ marginTop: 36, fontSize: 12.5, color: "var(--text-tertiary)" }}>Film master, poster, and backdrop are required to continue.</p>
      )}
    </div>
  );
}
