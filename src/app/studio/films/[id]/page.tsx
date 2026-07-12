"use client";

import { useParams, useRouter } from "next/navigation";
import { CSSProperties, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { naira } from "@/lib/format";
import { StudioSidebar } from "@/components/studio/StudioSidebar";
import { Toggle } from "@/components/studio/upload/ui";
import { MonetizationTier, PublishedFilm } from "@/lib/uploadTypes";

type Tab = "overview" | "analytics" | "revenue" | "community" | "settings";
const TABS: [Tab, string][] = [["overview", "Overview"], ["analytics", "Analytics"], ["revenue", "Revenue"], ["community", "Community"], ["settings", "Settings"]];
type Range = "7d" | "28d" | "90d";
const RANGE_MULT: Record<Range, number> = { "7d": 0.16, "28d": 0.44, "90d": 1 };
const RANGE_LABEL: Record<Range, string> = { "7d": "last 7 days", "28d": "last 28 days", "90d": "last 90 days" };

const card: CSSProperties = { background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 };
const TIER_LABEL: Record<MonetizationTier, string> = { free: "Free", free_ads: "Free with ads", rent: "Rent", premium: "Premium" };

function StatusBadge({ status }: { status: "draft" | "scheduled" | "published" }) {
  const map = { draft: { bg: "var(--surface-3)", fg: "var(--text-secondary)", label: "Draft" }, scheduled: { bg: "var(--warning-subtle)", fg: "var(--warning)", label: "Scheduled" }, published: { bg: "var(--success-subtle)", fg: "var(--success)", label: "Live" } };
  const m = map[status];
  return <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 4, padding: "4px 10px", background: m.bg, color: m.fg }}>{m.label}</span>;
}

// Deterministic PRNG (mulberry32) seeded by film id so each film's analytics look stable
// across renders/tab switches instead of jumping around like Math.random() would.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function parseCompact(v: string): number {
  const m = v.replace(/,/g, "").match(/^([\d.]+)\s*(k|m)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suf = (m[2] || "").toLowerCase();
  return suf === "k" ? n * 1000 : suf === "m" ? n * 1000000 : n;
}
function formatCompact(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(n).toLocaleString();
}
function areaPath(vals: number[], w: number, h: number) {
  const max = Math.max(...vals), min = Math.min(...vals);
  const rng = max - min || 1, step = w / (vals.length - 1);
  const pts = vals.map((v, i) => (i * step).toFixed(2) + "," + (h - ((v - min) / rng) * h).toFixed(2));
  return { line: "M" + pts.join(" L"), area: "M0," + h + " L" + pts.join(" L") + " L" + w + "," + h + " Z" };
}

function buildAnalytics(film: PublishedFilm, range: Range) {
  const rand = seeded(film.id * 7919 + range.length);
  const mult = RANGE_MULT[range];
  const views = Math.round(parseCompact(film.stats!.views) * mult);
  const watchHrs = Math.round(parseCompact(film.stats!.watchTime) * mult);
  const comments = Math.round(parseCompact(film.stats!.comments) * mult);
  const completion = film.stats!.completionPct;
  const delta = (base: number) => Math.round((base + rand() * 10 - 3) * 10) / 10;

  const trend = Array.from({ length: 14 }, (_, i) => {
    const wobble = 0.72 + rand() * 0.5;
    const progress = (i + 1) / 14;
    return Math.max(1, views * progress * wobble * (0.5 + mult * 0.5));
  });

  const journey = [100];
  for (let i = 1; i < 5; i++) {
    const t = i / 4;
    journey.push(Math.round(100 - (100 - completion) * t - rand() * 3));
  }

  const countryPool: [string, number][] = [["Nigeria", 46 + rand() * 20], ["Ghana", 8 + rand() * 8], ["United Kingdom", 6 + rand() * 8], ["United States", 5 + rand() * 8], ["Kenya", 4 + rand() * 6], ["South Africa", 3 + rand() * 5]];
  const total = countryPool.reduce((a, [, v]) => a + v, 0);
  const geo = countryPool.map(([name, v]) => ({ name, pct: Math.round((v / total) * 100) })).sort((a, b) => b.pct - a.pct).slice(0, 5);

  const peaks = [3 + Math.floor(rand() * 6), 14 + Math.floor(rand() * 8), 26 + Math.floor(rand() * 8)];
  const heat = Array.from({ length: 36 }, (_, i) => {
    let d = 0.1;
    peaks.forEach((p) => { d = Math.max(d, 1 - Math.abs(i - p) / 4); });
    d = Math.max(0.06, Math.min(1, d + (rand() - 0.5) * 0.08));
    const mm = Math.round((i / 36) * (parseInt(film.runtime, 10) || 98));
    return { pct: d, label: `${mm} min · ${d > 0.6 ? "high" : d > 0.3 ? "medium" : "low"} activity` };
  });

  return {
    views, watchHrs, comments, completion,
    viewsDelta: delta(18), watchDelta: delta(12), completionDelta: delta(3), commentsDelta: delta(15),
    trend: areaPath(trend, 100, 40), journey: areaPath(journey, 100, 40), geo, heat,
  };
}

export default function FilmDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getPublishedFilm, updateFilm, deleteFilm, showToast } = useApp();
  const film = getPublishedFilm(Number(params.id));
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>("28d");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const goStudio = (section: string) => router.push(section === "films" ? "/studio?section=films" : `/studio?section=${section}`);
  const analytics = useMemo(() => (film?.stats ? buildAnalytics(film, range) : null), [film, range]);

  if (!film) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)" }}>
        <StudioSidebar activeKey="films" onSelect={(k) => (k === "upload" ? router.push("/studio/upload") : goStudio(k))} />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Film not found</div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>It may still be uploading, or the link is out of date.</p>
          <button onClick={() => goStudio("films")} style={{ minHeight: 44, padding: "0 22px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>Back to Studio</button>
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

  const runDelete = () => {
    deleteFilm(film.id);
    router.push("/studio?section=films");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
      <StudioSidebar activeKey="films" onSelect={(k) => (k === "upload" ? router.push("/studio/upload") : goStudio(k))} />

      <main className="cs-scroll" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 16, padding: "18px 34px", background: "rgba(22,23,25,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <button onClick={() => goStudio("films")} aria-label="Back to Films" title="Back to Films" style={{ width: 38, height: 38, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", borderRadius: "50%", background: "var(--surface-1)", color: "var(--text-primary)", cursor: "pointer" }}>
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
            analytics ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 250ms var(--ease-standard)" }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ display: "flex", gap: 4, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: 4 }}>
                    {(["7d", "28d", "90d"] as Range[]).map((r) => (
                      <button key={r} onClick={() => setRange(r)} style={{ minHeight: 30, padding: "0 13px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, background: range === r ? "var(--accent)" : "transparent", color: range === r ? "var(--text-on-accent)" : "var(--text-secondary)" }}>{r}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                  {[
                    ["Views", formatCompact(analytics.views), analytics.viewsDelta],
                    ["Watch time", formatCompact(analytics.watchHrs) + " hrs", analytics.watchDelta],
                    ["Avg completion", analytics.completion + "%", analytics.completionDelta],
                    ["Comments", formatCompact(analytics.comments), analytics.commentsDelta],
                  ].map(([label, value, d]) => {
                    const delta = d as number;
                    return (
                      <div key={label as string} style={card}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 24, marginTop: 10 }}>{value}</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? "var(--success)" : "var(--error)" }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 6 }}>{RANGE_LABEL[range]}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.01))", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>✦ Timestamp comment heatmap</span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Comment density across the runtime — hover a bar for detail</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, marginTop: 18 }}>
                    {analytics.heat.map((c, i) => (
                      <div key={i} title={c.label} style={{ flex: 1, height: 34, borderRadius: 3, background: `rgba(255,255,255,${c.pct.toFixed(2)})`, cursor: "default", transition: "transform 120ms var(--ease-standard)" }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 10 }}><span>0 min</span><span>{film.runtime}</span></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={card}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2 }}>Views over time</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>{RANGE_LABEL[range]}</div>
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 130 }}>
                      <defs><linearGradient id="fdArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,.22)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient></defs>
                      <path d={analytics.trend.area} fill="url(#fdArea)" />
                      <path d={analytics.trend.line} fill="none" stroke="#FFFFFF" strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div style={card}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2 }}>Viewer completion journey</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>Where viewers stop watching</div>
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 130 }}>
                      <path d={analytics.journey.area} fill="rgba(255,255,255,.12)" />
                      <path d={analytics.journey.line} fill="none" stroke="#FFFFFF" strokeWidth="0.7" />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 6 }}><span>Start · 100%</span><span>End · {analytics.completion}%</span></div>
                  </div>
                </div>

                <div style={card}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16 }}>Geographic distribution</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {analytics.geo.map((g) => (
                      <div key={g.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span>{g.name}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{g.pct}%</span></div>
                        <div style={{ height: 7, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: g.pct + "%", background: "var(--accent)", borderRadius: 999 }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ ...card, padding: "60px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: "var(--text-tertiary)" }}><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 5-6" /></svg>
                <div style={{ fontSize: 15, fontWeight: 700 }}>No analytics yet</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", maxWidth: 340 }}>Views, watch time, and audience breakdowns will show up here once people start watching.</div>
              </div>
            )
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

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--error)" }}>Danger zone</div>
                {film.id > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 18px", background: "var(--error-subtle)", border: "1px solid var(--error)", borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>Delete this film</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Removes it from DORIS permanently, including its page, comments, and stats. This can&rsquo;t be undone.</div>
                    </div>
                    <button onClick={() => { setDeleteOpen(true); setConfirmText(""); }} style={{ flex: "none", minHeight: 38, padding: "0 16px", border: "1px solid var(--error)", borderRadius: 999, background: "none", color: "var(--error)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>Delete film</button>
                  </div>
                ) : (
                  <div style={{ padding: "16px 18px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 12.5, color: "var(--text-tertiary)" }}>This is a DORIS showcase title and can&rsquo;t be deleted.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {deleteOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}
        >
          <div style={{ width: "100%", maxWidth: 440, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,.65)", padding: 24, animation: "dorisRise 220ms var(--ease-standard)" }}>
            <div style={{ display: "flex", gap: 14 }}>
              <span style={{ width: 40, height: 40, flex: "none", borderRadius: "50%", background: "var(--error-subtle)", color: "var(--error)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>Delete &ldquo;{film.title}&rdquo;?</div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55 }}>This permanently removes the film, its title page, comments, and stats from DORIS. This can&rsquo;t be undone.</p>
              </div>
            </div>
            <div style={{ margin: "18px 0 8px" }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>Type <b style={{ color: "var(--text-primary)" }}>{film.title}</b> to confirm</label>
              <input
                autoFocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                style={{ width: "100%", marginTop: 8, minHeight: 44, padding: "0 14px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-1)", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 13.5 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setDeleteOpen(false)} style={{ flex: 1, minHeight: 44, border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={runDelete}
                disabled={confirmText.trim() !== film.title.trim()}
                style={{ flex: 1, minHeight: 44, border: "none", borderRadius: 999, background: "var(--error)", color: "#fff", fontWeight: 800, fontSize: 13.5, cursor: confirmText.trim() === film.title.trim() ? "pointer" : "not-allowed", opacity: confirmText.trim() === film.title.trim() ? 1 : 0.45, transition: "opacity 150ms var(--ease-standard)" }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
