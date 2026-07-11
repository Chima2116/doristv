"use client";

import { TERRITORY_OPTIONS, UploadDraft } from "@/lib/uploadTypes";
import { ChipPicker, FieldLabel, StepHeader, fieldWrap } from "../ui";

type Update = (patch: Partial<UploadDraft> | ((d: UploadDraft) => Partial<UploadDraft>)) => void;

export function RightsStep({ draft, update }: { draft: UploadDraft; update: Update }) {
  const toggleTerritory = (v: string) => {
    update((d) => ({ territories: d.territories.includes(v) ? d.territories.filter((t) => t !== v) : [...d.territories, v] }));
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 7 of 9" title="Rights & distribution" sub="A few formalities before your film can go live." />

      <div style={fieldWrap}>
        <FieldLabel>Distribution territories</FieldLabel>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => update({ territoryScope: "worldwide" })}
            style={{ flex: 1, textAlign: "left", padding: 18, borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", background: draft.territoryScope === "worldwide" ? "var(--accent-subtle)" : "var(--surface-1)", border: "1px solid " + (draft.territoryScope === "worldwide" ? "var(--accent)" : "var(--border-subtle)") }}
          >
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Worldwide</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Available to every DORIS territory</span>
          </button>
          <button
            onClick={() => update({ territoryScope: "select" })}
            style={{ flex: 1, textAlign: "left", padding: 18, borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", background: draft.territoryScope === "select" ? "var(--accent-subtle)" : "var(--surface-1)", border: "1px solid " + (draft.territoryScope === "select" ? "var(--accent)" : "var(--border-subtle)") }}
          >
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Select territories</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Choose exactly where it streams</span>
          </button>
        </div>
        {draft.territoryScope === "select" && (
          <div style={{ marginTop: 16, animation: "dorisRise 200ms var(--ease-standard) both" }}>
            <ChipPicker options={TERRITORY_OPTIONS} selected={draft.territories} onToggle={toggleTerritory} />
          </div>
        )}
      </div>

      <div style={fieldWrap}>
        <FieldLabel>Licensing</FieldLabel>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => update({ licensing: "nonexclusive" })}
            style={{ flex: 1, textAlign: "left", padding: 18, borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", background: draft.licensing === "nonexclusive" ? "var(--accent-subtle)" : "var(--surface-1)", border: "1px solid " + (draft.licensing === "nonexclusive" ? "var(--accent)" : "var(--border-subtle)") }}
          >
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Non-exclusive</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Keep distributing it elsewhere too</span>
          </button>
          <button
            onClick={() => update({ licensing: "exclusive" })}
            style={{ flex: 1, textAlign: "left", padding: 18, borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", background: draft.licensing === "exclusive" ? "var(--accent-subtle)" : "var(--surface-1)", border: "1px solid " + (draft.licensing === "exclusive" ? "var(--accent)" : "var(--border-subtle)") }}
          >
            <span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>Exclusive to DORIS</span>
            <span style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>Priority placement & promotion</span>
          </button>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 8, padding: 18, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
        <input type="checkbox" checked={draft.rightsConfirmed} onChange={(e) => update({ rightsConfirmed: e.target.checked })} style={{ width: 19, height: 19, marginTop: 1, accentColor: "#FFFFFF", flex: "none" }} />
        <span style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>I own or have licensed all rights to this film — footage, music, and performances — and can prove it if asked.</span>
      </label>
    </div>
  );
}
