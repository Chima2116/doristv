"use client";

import { useParams, useRouter } from "next/navigation";
import { CSSProperties, useState } from "react";
import { useApp } from "@/lib/store";
import { naira } from "@/lib/format";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { Toggle } from "@/components/studio/upload/ui";
import { MonetizationTier } from "@/lib/uploadTypes";

type Tab = "overview" | "analytics" | "revenue" | "community" | "settings";
const TABS: [Tab, string][] = [["overview", "Overview"], ["analytics", "Analytics"], ["revenue", "Revenue"], ["community", "Community"], ["settings", "Settings"]];

const card: CSSProperties = { background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 };
const TIER_LABEL: Record<MonetizationTier, string> = { free: "Free", free_ads: "Free with ads", rent: "Rent", premium: "Premium" };

function StatusBadge({ status }: { status: "draft" | "scheduled" | "published" }) {
  const map = { draft: { bg: "var(--surface-3)", fg: "var(--text-secondary)", label: "Draft" }, scheduled: { bg: "var(--warning-subtle)", fg: "var(--warning)", label: "Scheduled" }, published: { bg: "var(--success-subtle)", fg: "var(--success)", label: "Live" } };
  const m = map[status];
  return <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 4, padding: "4px 10px", background: m.bg, color: m.fg }}>{m.label}</span>;
}

export default function FilmDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getPublishedFilm, updateFilm, showToast } = useApp();
  const film = getPublishedFilm(Number(params.id));
  const [tab, setTab] = useState<Tab>("overview");

  if (!film) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)" }}>
        <StudioSidebar activeKey="films" onSelect={(k) => router.push(k === "upload" ? "/studio/upload" : "/studio")} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Film not found</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>It may still be uploading, or the link is out of date.</p>
          <button onClick={() => router.push("/studio")} style={{ minHeight: 44, padding: "0 22px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>Back to Studio</button>
        </main>
      </div>
    );
  }

  const kpis: [string, string, string][] = film.stats
    ? [
        ["Views", film.stats.views, "all time"], ["Watch time", film.stats.watchTime, `${film.stats.completionPct}% avg completion`],
        ["Revenue", film.stats.revenue, "this period"], ["Comments", film.stats.comments, `score ${film.stats.score}`],
      ]
    : [
        ["Views", "0", "no views yet"], ["Watch time", "0 hrs", "just published"],
        ["Revenue", naira(0), film.tier === "free" ? "free titles don't earn directly" : "first sale pending"],
        ["Comments", "0", "start the conversation"],
      ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
      <StudioSidebar activeKey="films" onSelect={(k) => router.push(k === "upload" ? "/studio/upload" : "/studio")} />

      <main className="cs-scroll" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 16, padding: "18px 34px", background: "rgba(22,23,25,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <button onClick={() => router.push("/studio")} aria-label="Back to Studio" style={{ width: 38, height: 38, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", borderRadius: "50%", background: "var(--surface-1)", color: "var(--text-primary)", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>{film.title}</h1>
              <StatusBadge status={film.status} />
            </div>
          </div>
          <button onClick={() => router.push(`/title/${film.id}`)} style={{ minHeight: 38, padding: "0 16px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>View title page</button>
        </header>

        <div style={{ padding: "24px 34px 0" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: 4, width: "fit-content" }}>
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{ minHeight: 34, padding: "0 16px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, background: tab === k ? "#fff" : "transparent", color: tab === k ? "#1A1B1E" : "var(--text-secondary)" }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px 34px 64px" }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 250ms var(--ease-standard)" }}>
              <div style={{ display: "flex", gap: 20, ...card, padding: 20 }}>
                <span style={{ width: 100, aspectRatio: "2/3", flex: "none", borderRadius: 8, overflow: "hidden", background: "var(--surface-3)" }}>
                  {film.posterUrl && <img src={film.posterUrl} alt={film.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)" }}>{film.title}</span>
                  <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 560 }}>{film.synopsis}</p>
                  <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--text-tertiary)", flexWrap: "wrap", marginTop: 4 }}>
                    <span>{film.year}</span><span>·</span><span>{film.runtime}</span><span>·</span><span>{film.genres.join(", ") || "—"}</span><span>·</span><span>{TIER_LABEL[film.tier]}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {kpis.map(([label, value, sub]) => (
                  <div key={label} style={card}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                    <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 8 }}>{value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Share your film</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>doristv.app/title/{film.id}</div>
                </div>
                <button onClick={() => showToast("Link copied")} style={{ minHeight: 38, padding: "0 16px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Copy link</button>
              </div>
            </div>
          )}

          {tab === "analytics" && (
            <div style={{ ...card, padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: "var(--text-tertiary)" }}><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>
              <div style={{ fontSize: 15, fontWeight: 700 }}>No analytics yet</div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", maxWidth: 340 }}>Views, watch time, and audience breakdowns will show up here once people start watching.</div>
            </div>
          )}

          {tab === "revenue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Pending payout</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{film.stats ? film.stats.revenue : naira(0)}</span>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>{TIER_LABEL[film.tier]}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                  {film.tier === "rent" && `${naira(film.price || 0)} per rental · you keep 70%`}
                  {film.tier === "free_ads" && "You earn 60% of ad revenue"}
                  {film.tier === "premium" && "Paid from the premium pool by watch time"}
                  {film.tier === "free" && "This title doesn't generate direct revenue"}
                </div>
              </div>
            </div>
          )}

          {tab === "community" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["timestamped", "creatorNotes", "featuredMoments"] as const).map((k) => (
                  <span key={k} style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "6px 14px", background: film.community[k] ? "var(--success-subtle)" : "var(--surface-2)", color: film.community[k] ? "var(--success)" : "var(--text-tertiary)" }}>
                    {film.community[k] ? "✓" : "—"} {k === "timestamped" ? "Timestamped discussions" : k === "creatorNotes" ? "Creator notes" : "Featured moments"}
                  </span>
                ))}
              </div>
              <div style={{ ...card, padding: "50px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: "var(--text-tertiary)" }}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No discussions yet</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Comments from viewers will appear here, timestamped to the moment.</div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Monetization</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["free", "free_ads", "rent", "premium"] as MonetizationTier[]).map((t) => (
                    <button key={t} onClick={() => { updateFilm(film.id, { tier: t }); showToast("Monetization updated"); }} style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, border: "1px solid " + (film.tier === t ? "var(--accent)" : "var(--border-subtle)"), background: film.tier === t ? "#fff" : "var(--surface-1)", color: film.tier === t ? "#1A1B1E" : "var(--text-secondary)" }}>{TIER_LABEL[t]}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Community features</div>
                {(["timestamped", "creatorNotes", "featuredMoments"] as const).map((k) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{k === "timestamped" ? "Timestamped discussions" : k === "creatorNotes" ? "Creator notes" : "Featured moments"}</span>
                    <Toggle on={film.community[k]} onChange={(v) => updateFilm(film.id, { community: { ...film.community, [k]: v } })} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
