"use client";

import { UploadDraft } from "@/lib/uploadTypes";
import { naira } from "@/lib/format";
import { StepHeader } from "../ui";

const TIER_LABEL: Record<UploadDraft["tier"], string> = { free: "Free", free_ads: "Free with ads", rent: "Rent", premium: "Premium" };

export function PreviewStep({ draft }: { draft: UploadDraft }) {
  const director = draft.crew.find((c) => c.role === "Director")?.name || draft.crew[0]?.name || "You";
  const runtimeLabel = draft.runtimeMinutes ? `${Math.floor(Number(draft.runtimeMinutes) / 60)}h ${Number(draft.runtimeMinutes) % 60}m` : "—";
  const genreLabel = draft.genres[0] || "—";
  const languageLabel = draft.languages.join(" · ") || "—";
  const ctaLabel = draft.tier === "rent" ? `Rent · ${naira(draft.rentPrice)} · 48hr` : draft.tier === "premium" ? "Watch with Premium" : "Watch Free";

  const iconBtnStyle = { width: 44, height: 44, flex: "none" as const, borderRadius: "50%", border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.06)", color: "#fff", display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, backdropFilter: "blur(8px)" };

  const detailSpecs = [
    { k: "Runtime", v: runtimeLabel }, { k: "Genre", v: draft.genres.join(", ") || "—" }, { k: "Release year", v: draft.releaseYear || "—" },
    { k: "Language", v: languageLabel }, { k: "Country", v: draft.country }, { k: "Age rating", v: draft.ageRating || "—" },
  ];

  return (
    <div style={{ padding: "56px 32px 64px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto 8px" }}>
        <StepHeader eyebrow="Step 8 of 9" title="This is your title page" sub="Exactly how viewers will see your film on DORIS — check it over before you publish." />
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-4)" }}>
        <section style={{ position: "relative", width: "100%", minHeight: "max(520px, 68vh)", overflow: "hidden", background: "var(--surface-2)" }}>
          {draft.assets.backdrop.objectUrl ? (
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${draft.assets.backdrop.objectUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-disabled)", fontSize: 13 }}>No backdrop uploaded yet</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(26,27,30,.94) 0%, rgba(26,27,30,.6) 42%, rgba(26,27,30,.1) 72%, rgba(26,27,30,0) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1B1E 1%, rgba(26,27,30,.35) 30%, rgba(26,27,30,0) 62%)" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "64px 48px 56px", minHeight: "max(520px, 68vh)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", background: "#fff", color: "#1A1B1E" }}>{TIER_LABEL[draft.tier]}</span>
                {draft.ageRating && <span style={{ fontSize: 11, border: "1px solid var(--border-strong)", borderRadius: 5, padding: "1px 7px" }}>{draft.ageRating}</span>}
              </div>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(38px,5vw,64px)", lineHeight: 0.98, letterSpacing: "-0.03em", textShadow: "0 2px 30px rgba(0,0,0,.5)" }}>{draft.title || "Untitled film"}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13, color: "var(--text-secondary)" }}>
                <span>{draft.releaseYear || "—"}</span><span style={{ opacity: .4 }}>•</span><span>{runtimeLabel}</span><span style={{ opacity: .4 }}>•</span><span>{genreLabel}</span><span style={{ opacity: .4 }}>•</span><span>Dir. {director}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 480 }}>{draft.synopsis || "Your synopsis will appear here."}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 46, padding: "0 24px", borderRadius: 999, background: "#fff", color: "#1A1B1E", fontWeight: 800, fontSize: 13.5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>{ctaLabel}
                </span>
                <span style={iconBtnStyle}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span>
                <span style={iconBtnStyle}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg></span>
              </div>
            </div>
          </div>
        </section>

        <div style={{ display: "flex", gap: 40, alignItems: "flex-start", padding: "40px 48px 48px", background: "#1A1B1E" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Synopsis</span>
              <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.7, color: "var(--text-primary)", maxWidth: 620 }}>{draft.synopsis || "—"}</p>
            </div>
            {draft.crew.length > 0 && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Cast & crew</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14 }}>
                  {draft.crew.map((c) => (
                    <div key={c.id} style={{ fontSize: 13.5 }}>
                      <span style={{ fontWeight: 700 }}>{c.name}</span>
                      <span style={{ color: "var(--text-tertiary)" }}> · {c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside style={{ width: 230, flex: "none", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>Film details</span>
            {detailSpecs.map((sp) => (
              <div key={sp.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-tertiary)" }}>{sp.k}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{sp.v}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
