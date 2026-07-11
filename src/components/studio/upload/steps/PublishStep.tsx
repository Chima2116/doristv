"use client";

import { useState } from "react";
import { UploadDraft } from "@/lib/uploadTypes";
import { PrimaryButton, SecondaryButton, StepHeader, inputStyle } from "../ui";

export function PublishStep({ draft, onPublish, onSchedule, onSaveDraft }: {
  draft: UploadDraft;
  onPublish: () => void;
  onSchedule: (whenISO: string) => void;
  onSaveDraft: () => void;
}) {
  const [scheduling, setScheduling] = useState(false);
  const [when, setWhen] = useState("");

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "72px 32px 64px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--accent-subtle)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
      </span>
      <StepHeader eyebrow="Step 9 of 9" title={`${draft.title || "Your film"} is ready.`} sub="Publish now, schedule a release date, or save it as a draft and come back later." />

      {!scheduling ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 340 }}>
          <PrimaryButton onClick={onPublish} style={{ width: "100%" }}>Publish now</PrimaryButton>
          <SecondaryButton onClick={() => setScheduling(true)} style={{ width: "100%" }}>Schedule release</SecondaryButton>
          <button onClick={onSaveDraft} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>Save as draft &amp; exit</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 340, animation: "dorisRise 200ms var(--ease-standard) both" }}>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={inputStyle} />
          <PrimaryButton onClick={() => when && onSchedule(when)} disabled={!when} style={{ width: "100%" }}>Confirm schedule</PrimaryButton>
          <button onClick={() => setScheduling(false)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>← Back</button>
        </div>
      )}
    </div>
  );
}
