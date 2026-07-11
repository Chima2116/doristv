"use client";

import { MonetizationTier, UploadDraft } from "@/lib/uploadTypes";
import { naira } from "@/lib/format";
import { StepHeader } from "../ui";

const TIERS: { key: MonetizationTier; label: string; tag: string; desc: string; earn: string }[] = [
  { key: "free", label: "Free", tag: "Free", desc: "Widest possible reach — no barrier to watching.", earn: "No direct revenue" },
  { key: "free_ads", label: "Free with ads", tag: "Ads", desc: "Free to watch, supported by a short pre-roll.", earn: "You earn 60% of ad revenue" },
  { key: "rent", label: "Rent", tag: "Rent", desc: "A 48-hour rental window at a price you set.", earn: "You keep 70% of every rental" },
  { key: "premium", label: "Premium", tag: "Premium", desc: "Included in the DORIS subscription catalogue.", earn: "Paid from the premium pool by watch time" },
];

const PRICES = [500, 800, 1000, 1500, 2000];

export function MonetizationStep({ draft, update }: { draft: UploadDraft; update: (patch: Partial<UploadDraft>) => void }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 5 of 9" title="How should viewers watch it?" sub="You can change this later from your Film Dashboard." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {TIERS.map((t) => {
          const active = draft.tier === t.key;
          return (
            <button
              key={t.key}
              onClick={() => update({ tier: t.key })}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: 10,
                padding: 22, borderRadius: "var(--radius-lg)", cursor: "pointer", fontFamily: "var(--font-ui)",
                background: active ? "var(--accent-subtle)" : "var(--surface-1)",
                border: "1px solid " + (active ? "var(--accent)" : "var(--border-subtle)"), transition: "all 150ms var(--ease-standard)",
              }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "rgba(255,255,255,.1)", borderRadius: 4, padding: "3px 9px" }}>{t.tag}</span>
              <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--font-display)" }}>{t.label}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t.desc}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)", marginTop: 4 }}>{t.earn}</span>
            </button>
          );
        })}
      </div>

      {draft.tier === "rent" && (
        <div style={{ marginTop: 24, padding: 22, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: 14, animation: "dorisRise 220ms var(--ease-standard) both" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>Rental price</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRICES.map((p) => (
              <button
                key={p}
                onClick={() => update({ rentPrice: p })}
                style={{
                  minHeight: 40, padding: "0 18px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 700,
                  border: "1px solid " + (draft.rentPrice === p ? "var(--accent)" : "var(--border-subtle)"),
                  background: draft.rentPrice === p ? "#fff" : "var(--surface-2)", color: draft.rentPrice === p ? "#1A1B1E" : "var(--text-secondary)",
                }}
              >
                {naira(p)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Per rental, you receive</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--success)" }}>{naira(Math.round(draft.rentPrice * 0.7))} (70%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
