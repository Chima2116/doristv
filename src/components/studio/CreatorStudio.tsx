"use client";

import { CSSProperties, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { StudioSidebar, type Section } from "./StudioSidebar";
import { Icon } from "./icons";

const TITLES: Record<Section, string> = {
  dashboard: "Dashboard", films: "Films", analytics: "Analytics", audience: "Audience", revenue: "Revenue",
  comments: "Comments", community: "Engagement", funding: "Funding & Collaborations", payouts: "Payouts", settings: "Settings",
};

const card: CSSProperties = { background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 };
function deltaStyle(up: boolean): CSSProperties { return { fontSize: 12, fontWeight: 700, color: up ? "var(--success)" : "var(--error)" }; }

function areaPath(vals: number[], w: number, h: number) {
  const max = Math.max(...vals), min = Math.min(...vals);
  const rng = max - min || 1, step = w / (vals.length - 1);
  const pts = vals.map((v, i) => (i * step).toFixed(2) + "," + (h - ((v - min) / rng) * h).toFixed(2));
  return { line: "M" + pts.join(" L"), area: "M0," + h + " L" + pts.join(" L") + " L" + w + "," + h + " Z" };
}
function bars(arr: [string, number][]) {
  const mx = Math.max(...arr.map((a) => a[1]));
  return arr.map(([name, v]) => ({ name, pct: Math.round((v / mx) * 100) + "%", barStyle: { height: "100%", width: (v / mx) * 100 + "%", background: "var(--accent)", borderRadius: 999 } as CSSProperties }));
}
function bg(id: number, pos?: string) {
  const imgs: Record<number, string> = { 1: "/films/film-weight-of-water.png", 2: "/films/film-third-mainland.png", 3: "/films/film-harmattan-bride.png", 4: "/films/film-danfo-nights.png" };
  return `url("${imgs[id]}") center ${pos || "center"} / cover no-repeat`;
}

const SECTION_KEYS = new Set<Section>(["dashboard", "films", "analytics", "audience", "revenue", "comments", "community", "funding", "payouts", "settings"]);

export function CreatorStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publishedFilms, showToast } = useApp();
  const requestedSection = searchParams.get("section");
  const initialSection = requestedSection && SECTION_KEYS.has(requestedSection as Section) ? (requestedSection as Section) : "dashboard";
  const [section, setSection] = useState<Section>(initialSection);
  const [range, setRange] = useState<"7d" | "28d" | "90d">("28d");
  const [filmFilter, setFilmFilter] = useState("All");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [postedReplies, setPostedReplies] = useState<Record<number, string>>({});
  const [engageFilter, setEngageFilter] = useState("All");

  const go = (s: Section) => setSection(s);
  const goUpload = () => router.push("/studio/upload");
  const toastFunding = () => showToast("Marketplace flow ships in the next build");

  const rangeLabel = range === "7d" ? "last 7 days" : range === "90d" ? "last 90 days" : "last 28 days";

  // ---- dashboard ----
  const kpiDef: [string, string, string, string, boolean, string][] = [
    ["Total views", "48,240", "▲ 18%", "vs last period", true, "analytics"],
    ["Watch time", "3,140 hrs", "▲ 12%", "avg 61% complete", true, "dashboard"],
    ["Revenue", "₦212,900", "▲ 24%", "this period", true, "revenue"],
    ["Active viewers", "1,284", "▲ 9%", "watching now", true, "audience"],
    ["Followers", "12,410", "▲ 320", "new this period", true, "audience"],
    ["Comments", "1,284", "▲ 15%", "6 need a reply", true, "comments"],
    ["Pending payout", "₦184,500", "Jul 30", "above threshold", true, "payouts"],
    ["Avg completion", "61%", "▲ 3%", "strong retention", true, "films"],
  ];
  const va = areaPath([12, 15, 13, 18, 22, 19, 24, 28, 26, 31, 29, 35, 33, 41, 38, 44, 48], 100, 38);
  const revByFilm = [
    { title: "The Weight of Water", amount: "₦148,200", pct: 100 },
    { title: "Second Rain", amount: "₦52,300", pct: 35 },
    { title: "Danfo Nights (guest)", amount: "₦12,400", pct: 9 },
  ];
  const insights = [
    { tag: "Most discussed", title: "The Weight of Water", detail: "214 comments · 6 hot scenes", img: 1 },
    { tag: "Fastest growing", title: "Second Rain", detail: "▲ 42% views this week", img: 4 },
    { tag: "Trending scene", title: "Golden hour · 42:10", detail: "14 comments in 48h", img: 1 },
    { tag: "Featured by DORIS", title: "Editor's Pick shelf", detail: "Home billboard · this week", img: 3 },
  ];
  const pulseRaw: [string, string, number][] = [["6:12", "Lagoon dawn", 3], ["24:50", "The market", 6], ["42:10", "Golden hour", 14], ["1:00:50", "The storm", 8], ["1:10:10", "Return", 5], ["1:25:00", "Final shot", 9]];
  const pmax = 14;
  const pulse = pulseRaw.map(([t, n, c]) => ({ time: t, name: t + " · " + n + " — " + c + " comments", barStyle: { width: "100%", height: Math.max(8, (c / pmax) * 100) + "%", background: c === pmax ? "var(--accent)" : "rgba(255,255,255,.4)", borderRadius: "5px 5px 2px 2px" } as CSSProperties }));
  const reviews = [
    { name: "Amara N.", initials: "AN", stars: "★★★★★", text: "The most beautiful Nigerian film I've seen this year." },
    { name: "Chidi E.", initials: "CE", stars: "★★★★☆", text: "That golden-hour sequence lives in my head rent-free." },
  ];

  // ---- films ----
  const stTag = (label: string, kind: "live" | "review" | "draft"): CSSProperties => ({ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", display: "inline-block", background: kind === "live" ? "var(--success-subtle)" : kind === "review" ? "var(--warning-subtle)" : "var(--surface-3)", color: kind === "live" ? "var(--success)" : kind === "review" ? "var(--warning)" : "var(--text-secondary)" });
  const filmDefs = publishedFilms.map((f) => ({
    imgUrl: f.posterUrl || undefined, id: f.id, title: f.title,
    meta: `${f.genres[0] || "Film"} · ${f.runtime}`,
    status: f.status === "published" ? "Live" : f.status === "scheduled" ? "Scheduled" : "Draft",
    vis: f.status === "published" ? "Public · " + f.tier : "Hidden",
    ok: f.status === "published" ? "live" as const : f.status === "scheduled" ? "review" as const : "draft" as const,
    views: f.stats?.views ?? (f.status === "published" ? "0" : "—"),
    rev: f.stats?.revenue ?? "₦0",
    comp: f.stats?.completionPct ?? 0,
    score: f.stats?.score ?? "—",
  }));
  const filmRows = filmDefs.filter((f) => filmFilter === "All" || (filmFilter === "Live" && f.ok === "live") || (filmFilter === "In Review" && f.ok === "review"));

  // ---- analytics ----
  const analyticsKpis: [string, string, string, boolean][] = [["Views", "48,240", "▲ 18%", true], ["Watch time", "3,140 hrs", "▲ 12%", true], ["Revenue", "₦212,900", "▲ 24%", true], ["Returning viewers", "58%", "▲ 4%", true]];
  const hpeaks = [4, 9, 24, 30, 37];
  const heatCells = Array.from({ length: 40 }, (_, i) => {
    let d = 0.12; hpeaks.forEach((p) => { d = Math.max(d, 1 - Math.abs(i - p) / 3.5); });
    d = Math.max(0.08, Math.min(1, d + (i % 3 === 0 ? 0.05 : 0)));
    const mm = Math.round((i / 40) * 98);
    return { label: mm + " min · " + (d > 0.6 ? "high" : d > 0.3 ? "medium" : "low") + " activity", style: { flex: 1, height: 34, borderRadius: 3, background: "rgba(255,255,255," + d.toFixed(2) + ")" } as CSSProperties };
  });
  const heatLegend = [0.1, 0.3, 0.5, 0.7, 0.95].map((d) => ({ style: { width: 14, height: 14, borderRadius: 3, background: "rgba(255,255,255," + d + ")" } as CSSProperties }));
  const geo = bars([["Nigeria", 62], ["Ghana", 14], ["United Kingdom", 9], ["United States", 8], ["Kenya", 7]]);
  const da = areaPath([100, 96, 91, 88, 84, 80, 77, 74, 72, 69, 66, 63, 61], 100, 40);

  // ---- audience ----
  const audienceKpis: [string, string, string, boolean][] = [["Returning viewers", "58%", "▲ 4%", true], ["New viewers", "42%", "▲ 6%", true], ["Avg watch duration", "38 min", "▲ 2m", true], ["Sub conversion", "6.2%", "▲ 0.8%", true]];
  const cities = bars([["Lagos", 44], ["Abuja", 18], ["Port Harcourt", 11], ["Accra", 9], ["London", 7]]);
  const devices = bars([["Mobile (Android)", 71], ["Mobile (iOS)", 16], ["Desktop / TV", 13]]);

  // ---- revenue ----
  const revSourcesRaw: [string, string, number][] = [["Rentals (70% share)", "₦92,400", 92], ["Premium pool (watch time)", "₦74,100", 74], ["Ad revenue (60% share)", "₦31,600", 32], ["Tips from viewers", "₦14,800", 15]];
  const rmax = 92;
  const revSources = revSourcesRaw.map(([name, amount, v]) => ({ name, amount, barStyle: { height: "100%", width: (v / rmax) * 100 + "%", background: "var(--accent)", borderRadius: 999 } as CSSProperties }));
  const rsceneRaw = [18, 34, 92, 46, 28, 55];
  const rsmax = 92;
  const revScene = rsceneRaw.map((v) => ({ barStyle: { width: "100%", height: Math.max(8, (v / rsmax) * 100) + "%", background: v === rsmax ? "var(--accent)" : "rgba(255,255,255,.4)", borderRadius: "5px 5px 2px 2px" } as CSSProperties }));

  // ---- payouts ----
  const payouts = [
    { date: "Jul 30, 2026", amount: "₦184,500", method: "GTBank ••4471", status: "Scheduled", ok: false },
    { date: "Jun 30, 2026", amount: "₦171,200", method: "GTBank ••4471", status: "Paid", ok: true },
    { date: "May 30, 2026", amount: "₦158,900", method: "GTBank ••4471", status: "Paid", ok: true },
    { date: "Apr 30, 2026", amount: "₦142,600", method: "GTBank ••4471", status: "Paid", ok: true },
  ];

  // ---- comments ----
  const commentTabsDef: [string, string][] = [["timestamp", "Timestamp"], ["scene", "Scene discussions"], ["pinned", "Pinned"], ["featured", "Featured reviews"]];
  const [commentTab, setCommentTab] = useState("timestamp");
  const cDefs = [
    { id: 1, name: "Amara N.", initials: "AN", time: "42:10", film: "The Weight of Water", ago: "2h", pinned: true, text: "That opening drone shot over the lagoon — I actually gasped in the cinema.", replied: true, reply: "Thank you Amara — three days of waiting for that light 🙏" },
    { id: 2, name: "Tunde O.", initials: "TO", time: "24:50", film: "The Weight of Water", ago: "5h", pinned: false, text: "The market scene dialogue is razor sharp. Whole row was laughing.", replied: false, reply: "" },
    { id: 3, name: "Ifeoma", initials: "IF", time: "1:00:50", film: "The Weight of Water", ago: "1d", pinned: false, text: "The storm sequence — did you shoot this practically?!", replied: false, reply: "" },
    { id: 4, name: "Seyi O.", initials: "SO", time: "1:25:00", film: "Second Rain", ago: "2d", pinned: false, text: "The final shot destroyed me. Sat through the whole credits.", replied: false, reply: "" },
  ];
  const smallBtn = (active: boolean): CSSProperties => ({ minHeight: 32, padding: "0 12px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 700, border: "1px solid " + (active ? "transparent" : "var(--border-strong)"), background: active ? "var(--accent)" : "none", color: active ? "var(--text-on-accent)" : "var(--text-secondary)" });

  // ---- engagement ----
  const good: CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--success)" };
  const quickActions = ["Start Discussion", "Post Crew Call", "Create Funding Request", "Share Production Update", "Ask the Community"];
  const naDef: [string, string, string, string, string][] = [
    ["comments", "6 comments awaiting your reply", "Across The Weight of Water and Second Rain", "6", "Reply"],
    ["community", "2 reported comments", "Flagged by viewers — review before they're auto-hidden", "2", "Review"],
    ["funding", "3 funding inquiries", "Producers interested in backing your next film", "3", "View"],
    ["briefcase", "1 collaboration request", "Co-director seeking a partner for an anthology slot", "1", "Open"],
    ["audience", "4 mentions & unanswered questions", "You were tagged in community threads", "4", "See"],
  ];
  const engageKpis: [string, string, string, string][] = [
    ["Community Score", "4.8/5", "▲ 0.2", "top 5% of creators"], ["New Comments · 7d", "214", "▲ 18%", "vs previous week"],
    ["Response Rate", "92%", "▲ 4%", "you reply to most"], ["Avg Response Time", "3.2h", "▼ 40m", "faster than last week"],
    ["Followers Gained", "+320", "▲ 12%", "this period"], ["Active Discussions", "18", "▲ 3", "ongoing threads"],
  ];
  const filmEngageDef: [string, number, string, string, string, string][] = [
    ["The Weight of Water", 1, "214", "6", "4.8", "2h ago"], ["Second Rain", 4, "39", "2", "4.6", "1d ago"], ["Harmattan Bride", 3, "71", "3", "4.7", "4h ago"],
  ];
  const discussedMomentsDef: [string, string, string, string, string][] = [
    ["42:10", "Golden hour on the water", "The Weight of Water", "86", "50% 30%"], ["1:00:50", "The storm breaks", "The Weight of Water", "42", "60% 50%"],
    ["24:50", "The market argument", "The Weight of Water", "18", "70% 35%"], ["6:12", "The lagoon at dawn", "The Weight of Water", "24", "20% 40%"],
  ];
  const catColor: Record<string, string> = { Discussion: "var(--text-tertiary)", "Crew Call": "var(--info)", Funding: "var(--success)", Festival: "var(--warning)", "Production Update": "var(--text-secondary)" };
  const feedDef: [string, string, string, string, string, string, string][] = [
    ["Discussion", "Ada M.", "3h", "How do you handle pacing notes from viewers?", "The timestamp comments are gold but I'm drowning in them. What's your triage system?", "24", "51"],
    ["Crew Call", "You", "1d", "Looking for a colourist — 12-min short, paid", "Shot on FX3, S-Log3. Need someone who's graded dark skin tones before.", "9", "21"],
    ["Funding", "Producer · Lóla A.", "2d", "Interested in co-financing your next feature", "Loved The Weight of Water. Let's talk about a ₦15M slate deal.", "6", "18"],
    ["Festival", "DORIS", "2d", "AFRIFF submissions close in 12 days", "Your traction qualifies you for the DORIS-verified screener fast-track.", "4", "33"],
    ["Production Update", "You", "5d", "Second Rain — colour grade locked", "Final master uploaded. Reviewers permitting, live next week.", "12", "64"],
  ];
  const feedChipsDef: [string, string][] = [["All", "All"], ["Discussions", "Discussion"], ["Crew Calls", "Crew Call"], ["Funding", "Funding"], ["Festival", "Festival"], ["Production", "Production Update"]];
  const feedItems = feedDef.filter(([cat]) => engageFilter === "All" || cat === engageFilter);

  // ---- funding ----
  const marketCats: [string, string, string, string][] = [
    ["Find investors", "Pitch your slate to backers who fund African indie film.", "42 active", "revenue"],
    ["Connect with producers", "Co-producers and executive producers open to new work.", "28 producers", "briefcase"],
    ["Hire crew", "DPs, editors, colourists, sound — vetted and rated.", "310 crew", "audience"],
    ["Discover actors", "Casting profiles and self-tapes from across the continent.", "540 actors", "audience"],
    ["Apply to festivals", "Submit to festivals with DORIS-verified screeners.", "17 open", "films"],
    ["Join collaborations", "Anthology slots and co-directed projects seeking partners.", "9 open", "community"],
  ];
  const festivals = [
    { name: "AFRIFF — Africa International Film Festival", detail: "Feature & short · Lagos", deadline: "12 days left", soon: true },
    { name: "Durban International Film Festival", detail: "Feature · South Africa", deadline: "34 days left", soon: false },
    { name: "Sundance — World Cinema", detail: "Feature · submissions open", deadline: "58 days left", soon: false },
  ];

  // ---- settings ----
  const settingsRows = [
    { title: "Payout account", desc: "Where DORIS sends your earnings", value: "GTBank ••4471", on: true },
    { title: "Public profile", desc: "Filmmaker page visible to viewers", value: "Visible", on: true },
    { title: "Comment moderation", desc: "Hold first-time commenters for review", value: "Off", on: false },
    { title: "Data-saver uploads", desc: "Compress before upload on cellular", value: "On", on: true },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
      <StudioSidebar activeKey={section} onSelect={(key) => (key === "upload" ? goUpload() : go(key))} />

      <main className="cs-scroll" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 16, padding: "18px 34px", background: "rgba(22,23,25,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Creator Studio</div>
            <h1 style={{ margin: "2px 0 0", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>{TITLES[section]}</h1>
          </div>
          <div style={{ display: "flex", gap: 4, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: 4 }}>
            {(["7d", "28d", "90d"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} style={{ minHeight: 30, padding: "0 13px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, background: range === r ? "var(--accent)" : "transparent", color: range === r ? "var(--text-on-accent)" : "var(--text-secondary)" }}>{r}</button>
            ))}
          </div>
          <button onClick={goUpload} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 42, padding: "0 18px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "var(--font-ui)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>Upload film
          </button>
        </header>

        <div style={{ padding: "28px 34px 64px" }}>

          {section === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {kpiDef.map(([label, value, delta, sub, up, icon]) => (
                  <div key={label} style={card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                      <span style={{ width: 26, height: 26, flex: "none", borderRadius: 8, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Icon name={icon as keyof typeof import("./icons").ICONS} /></span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 27, marginTop: 12, letterSpacing: "-0.01em" }}>{value}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                      <span style={deltaStyle(up)}>{delta}</span><span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Views &amp; watch time</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, marginTop: 6 }}>48,240 <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>views · {rangeLabel}</span></div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>▲ 18%</span>
                  </div>
                  <svg viewBox="0 0 100 38" preserveAspectRatio="none" style={{ width: "100%", height: 150, marginTop: 8, overflow: "visible" }}>
                    <defs><linearGradient id="csArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,.22)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" /></linearGradient></defs>
                    <path d={va.area} fill="url(#csArea)" />
                    <path d={va.line} fill="none" stroke="#FFFFFF" strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}><span>Jun 10</span><span>Jun 24</span><span>Jul 9</span></div>
                </div>

                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Revenue by film</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, margin: "6px 0 16px" }}>₦184,500</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
                    {revByFilm.map((r) => (
                      <div key={r.title}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{r.title}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{r.amount}</span></div>
                        <div style={{ height: 8, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: r.pct + "%", background: "var(--accent)", borderRadius: 999 }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>Quick insights</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                  {insights.map((i) => (
                    <div key={i.title} style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 150, border: "1px solid var(--border-subtle)" }}>
                      <div style={{ position: "absolute", inset: 0, background: bg(i.img, "30%") }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,17,19,.92) 0%, rgba(16,17,19,.35) 60%, rgba(16,17,19,.15) 100%)" }} />
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", opacity: .9 }}>{i.tag}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, lineHeight: 1.25 }}>{i.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{i.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>✦ Scene Pulse</span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>The Weight of Water — where viewers are talking</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginTop: 16 }}>
                    {pulse.map((b) => <div key={b.time} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}><div style={b.barStyle} title={b.name} /></div>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 8 }}><span>0:00</span><span>49:00</span><span>1:38:00</span></div>
                  <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>Peak: <b style={{ color: "var(--text-primary)" }}>42:10 · Golden hour on the water</b> — 14 comments.</p>
                </div>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Recent reviews</div>
                  {reviews.map((r) => (
                    <div key={r.name} style={{ display: "flex", gap: 10 }}>
                      <span style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "var(--surface-3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)" }}>{r.initials}</span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5 }}><b>{r.name}</b> <span style={{ color: "var(--text-tertiary)" }}>· {r.stars}</span></div><div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.45, marginTop: 2 }}>{r.text}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "films" && (
            <div style={{ animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["All", "Live", "In Review", "Draft"].map((c) => (
                  <button key={c} onClick={() => setFilmFilter(c)} style={{ minHeight: 34, padding: "0 15px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 600, border: "1px solid " + (filmFilter === c ? "var(--accent)" : "var(--border-subtle)"), background: filmFilter === c ? "var(--accent-subtle)" : "var(--surface-1)", color: filmFilter === c ? "var(--text-primary)" : "var(--text-secondary)" }}>{c}</button>
                ))}
              </div>
              <div className="cs-scroll" style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden", overflowX: "auto" }}>
                <div style={{ minWidth: 920 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1.1fr 1fr 0.8fr", padding: "14px 20px", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span>Film</span><span>Status</span><span>Views</span><span>Revenue</span><span>Completion</span><span>Community</span><span style={{ textAlign: "right" }}>Actions</span>
                  </div>
                  {filmRows.map((f) => (
                    <div
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/studio/films/${f.id}`)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/studio/films/${f.id}`); } }}
                      style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1.1fr 1fr 0.8fr", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span style={{ width: 46, height: 62, flex: "none", borderRadius: 6, background: f.imgUrl ? `url("${f.imgUrl}") center / cover no-repeat` : "var(--surface-3)" }} />
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.title}</div><div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{f.meta}</div></div>
                      </div>
                      <div><span style={stTag(f.status, f.ok)}>{f.status}</span><div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{f.vis}</div></div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>{f.views}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{f.rev}</span>
                      <div><div style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 5 }}>{f.comp ? f.comp + "%" : "—"}</div><div style={{ height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: (f.comp || 0) + "%", background: "var(--accent)", borderRadius: 999 }} /></div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", background: f.ok === "live" ? "var(--success)" : "var(--text-tertiary)" }} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{f.score}</span></div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span title="Open film dashboard" style={{ width: 32, height: 32, border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {analyticsKpis.map(([label, value, delta, up]) => (
                  <div key={label} style={card}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 24, marginTop: 10 }}>{value}</div>
                    <span style={deltaStyle(up)}>{delta}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.01))", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>✦ Timestamp Comment Heatmap</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>DORIS exclusive — comment density across the runtime</span>
                </div>
                <div style={{ display: "flex", gap: 3, marginTop: 18 }}>
                  {heatCells.map((c, i) => <div key={i} style={c.style} title={c.label} />)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 10 }}><span>0:00</span><span>The market · 24:50</span><span>Golden hour · 42:10</span><span>1:38:00</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 11, color: "var(--text-tertiary)" }}>Less{heatLegend.map((l, i) => <span key={i} style={l.style} />)}More</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2 }}>Viewer completion journey</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>Where viewers stop watching</div>
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: "100%", height: 130 }}>
                    <path d={da.area} fill="rgba(255,255,255,.12)" />
                    <path d={da.line} fill="none" stroke="#FFFFFF" strokeWidth="0.7" />
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-tertiary)", marginTop: 6 }}><span>Start · 100%</span><span>Mid · 74%</span><span>End · 61%</span></div>
                </div>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16 }}>Geographic distribution</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {geo.map((g) => (
                      <div key={g.name}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span>{g.name}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{g.pct}</span></div><div style={{ height: 7, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={g.barStyle} /></div></div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>✦ Scene Pulse — most discussed moments</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, marginTop: 16 }}>
                    {pulse.map((b) => (
                      <div key={b.time} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                        <div style={b.barStyle} title={b.name} />
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-tertiary)", textAlign: "center", marginTop: 6 }}>{b.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>✦ Audience sentiment</div>
                  <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ width: "72%", background: "var(--success)" }} /><div style={{ width: "21%", background: "var(--text-tertiary)" }} /><div style={{ width: "7%", background: "var(--warning)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--success)" }} />Positive</span><span style={{ fontFamily: "var(--font-mono)" }}>72%</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--text-tertiary)" }} />Neutral</span><span style={{ fontFamily: "var(--font-mono)" }}>21%</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--warning)" }} />Critical</span><span style={{ fontFamily: "var(--font-mono)" }}>7%</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "audience" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
                {audienceKpis.map(([label, value, delta, up]) => (
                  <div key={label} style={card}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 24, marginTop: 10 }}>{value}</div>
                    <span style={deltaStyle(up)}>{delta}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16 }}>Top cities</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{cities.map((g) => <div key={g.name}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span>{g.name}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{g.pct}</span></div><div style={{ height: 7, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={g.barStyle} /></div></div>)}</div>
                </div>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16 }}>Returning vs new · Devices</div>
                  <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
                    <div style={{ position: "relative", width: 104, height: 104, flex: "none", borderRadius: "50%", background: "conic-gradient(#FFFFFF 0% 58%, var(--surface-3) 58% 100%)" }}><div style={{ position: "absolute", inset: 14, borderRadius: "50%", background: "var(--surface-1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 18 }}>58%</span><span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>returning</span></div></div>
                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}><div><b style={{ color: "var(--text-primary)" }}>58%</b> returning viewers</div><div><b style={{ color: "var(--text-primary)" }}>42%</b> new this period</div></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{devices.map((g) => <div key={g.name}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span>{g.name}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{g.pct}</span></div><div style={{ height: 7, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={g.barStyle} /></div></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {section === "revenue" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14 }}>
                <div style={{ background: "linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.02))", border: "1px solid var(--border-strong)", borderRadius: 16, padding: 22 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Total earnings · all time</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 34, marginTop: 10 }}>₦1,284,600</div>
                  <div style={{ fontSize: 12.5, color: "var(--success)", marginTop: 6 }}>Your share: 70% rentals · 60% ad revenue — always transparent</div>
                </div>
                <div style={card}><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Pending payout</span><div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 28, marginTop: 10 }}>₦184,500</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>Pays out <b style={{ color: "var(--text-primary)" }}>Jul 30</b> · above ₦10k threshold ✓</div></div>
                <div style={card}><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>This month</span><div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 28, marginTop: 10 }}>₦212,900</div><div style={{ fontSize: 12, color: "var(--success)", marginTop: 6 }}>▲ 24% vs last month</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 16 }}>Revenue by source</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{revSources.map((g) => <div key={g.name}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}><span>{g.name}</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{g.amount}</span></div><div style={{ height: 8, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={g.barStyle} /></div></div>)}</div>
                </div>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>✦ Revenue by scene</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 14 }}>Which moments convert rentals</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>{revScene.map((b, i) => <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}><div style={b.barStyle} /></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {section === "payouts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1, ...card }}><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Next payout</span><div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 26, marginTop: 8 }}>₦184,500</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Jul 30 · GTBank ••4471</div></div>
                <div style={{ flex: 1, ...card }}><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Paid to date</span><div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 26, marginTop: 8 }}>₦1,100,100</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>14 payouts since 2023</div></div>
              </div>
              <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "14px 20px", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}><span>Date</span><span>Amount</span><span>Method</span><span style={{ textAlign: "right" }}>Status</span></div>
                {payouts.map((p) => (
                  <div key={p.date} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{p.date}</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{p.amount}</span><span style={{ color: "var(--text-secondary)" }}>{p.method}</span>
                    <span style={{ textAlign: "right" }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", background: p.ok ? "var(--success-subtle)" : "var(--warning-subtle)", color: p.ok ? "var(--success)" : "var(--warning)" }}>{p.status}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {commentTabsDef.map(([k, label]) => (
                  <button key={k} onClick={() => setCommentTab(k)} style={{ minHeight: 34, padding: "0 15px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, background: commentTab === k ? "var(--accent)" : "var(--surface-1)", color: commentTab === k ? "var(--text-on-accent)" : "var(--text-secondary)", border: "1px solid " + (commentTab === k ? "transparent" : "var(--border-subtle)") }}>{label}</button>
                ))}
              </div>
              {cDefs.map((c) => {
                const composing = replyTo === c.id;
                const replied = c.replied || !!postedReplies[c.id];
                const reply = postedReplies[c.id] || c.reply;
                return (
                  <div key={c.id} style={{ background: c.pinned ? "rgba(255,255,255,.05)" : "var(--surface-1)", border: "1px solid " + (c.pinned ? "var(--border-strong)" : "var(--border-subtle)"), borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "var(--surface-3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--text-secondary)" }}>{c.initials}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</span>
                          <button onClick={() => showToast("Opens player at " + c.time)} style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-subtle)", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer" }}>▸ {c.time}</button>
                          <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>on {c.film} · {c.ago}</span>
                          {c.pinned && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--accent)", border: "1px solid var(--border-strong)", borderRadius: 4, padding: "2px 6px" }}>Pinned</span>}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-primary)", marginTop: 6 }}>{c.text}</div>
                        {replied && (
                          <div style={{ marginTop: 10, marginLeft: 6, padding: "10px 12px", borderLeft: "2px solid var(--accent)", background: "var(--accent-subtle)", borderRadius: "0 8px 8px 0" }}><div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", marginBottom: 3 }}>You replied</div><div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45 }}>{reply}</div></div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button onClick={() => { setReplyTo(composing ? null : c.id); setReplyDraft(postedReplies[c.id] || ""); }} style={smallBtn(composing)}>Reply</button>
                          <button onClick={() => showToast(c.pinned ? "Unpinned" : "Pinned to top")} style={smallBtn(c.pinned)}>{c.pinned ? "Unpin" : "Pin"}</button>
                          <button onClick={() => showToast("Highlighted for viewers")} style={smallBtn(false)}>Highlight</button>
                          <button onClick={() => showToast("Comment hidden")} style={{ minHeight: 32, padding: "0 12px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-tertiary)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Hide</button>
                        </div>
                        {composing && (
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <input value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} placeholder="Reply as Kemi Adetiba…" style={{ flex: 1, minHeight: 38, background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "0 12px", fontSize: 13, color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-ui)" }} />
                            <button onClick={() => { const t = replyDraft.trim(); if (!t) { setReplyTo(null); return; } showToast("Reply posted"); setPostedReplies((prev) => ({ ...prev, [c.id]: t })); setReplyTo(null); setReplyDraft(""); }} style={{ minHeight: 38, padding: "0 16px", border: "none", borderRadius: 8, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Send</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {section === "community" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {quickActions.map((label, i) => (
                  <button key={label} onClick={() => showToast(label)} style={{ minHeight: 40, padding: "0 16px", borderRadius: 999, border: i === 0 ? "none" : "1px solid var(--border-strong)", background: i === 0 ? "var(--accent)" : "none", color: i === 0 ? "var(--text-on-accent)" : "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>{label}</button>
                ))}
              </div>

              <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warning)" }} />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>Needs attention</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}>{naDef.length} items</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Your inbox — most important first</span>
                </div>
                {naDef.map(([ic, title, desc, count, action]) => {
                  const tone = ic === "comments" || ic === "community" ? "warn" : "";
                  return (
                    <button key={title} onClick={() => showToast(action + " · " + title)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 18px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: "none", cursor: "pointer", fontFamily: "var(--font-ui)" }}>
                      <span style={{ width: 34, height: 34, flex: "none", borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", background: tone === "warn" ? "var(--warning-subtle)" : "var(--surface-2)", color: tone === "warn" ? "var(--warning)" : "var(--text-secondary)" }}><Icon name={ic as keyof typeof import("./icons").ICONS} /></span>
                      <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{title}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{desc}</span>
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, minWidth: 26, textAlign: "center", padding: "3px 8px", borderRadius: 999, background: tone === "warn" ? "var(--warning-subtle)" : "var(--surface-3)", color: tone === "warn" ? "var(--warning)" : "var(--text-primary)" }}>{count}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{action} →</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {engageKpis.map(([label, value, delta, sub]) => (
                  <div key={label} style={card}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 600 }}>{value}</span><span style={good}>{delta}</span></div>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{sub}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16, alignItems: "start" }}>
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 4 }}>Engagement by film</div>
                  {filmEngageDef.map(([title, img, comments, active, score, lastActivity]) => (
                    <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                      <span style={{ width: 40, height: 56, flex: "none", borderRadius: 6, background: bg(img, "40%") }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
                        <div style={{ display: "flex", gap: 14, marginTop: 5, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-tertiary)" }}><span>{comments} comments</span><span>{active} active</span><span>{lastActivity}</span></div>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, padding: "5px 10px", borderRadius: 8, background: "var(--surface-2)", color: "var(--text-primary)" }}>{score}</span>
                      <button onClick={() => showToast("Opens " + title + " discussions")} style={{ minHeight: 34, padding: "0 14px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Open</button>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12 }}>💬 Most discussed moments</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {discussedMomentsDef.map(([time, scene, filmName, comments, pos]) => (
                      <div key={time} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ position: "relative", width: 60, height: 38, flex: "none", borderRadius: 7, overflow: "hidden", background: `url("/films/film-weight-of-water.png") ${pos} / cover no-repeat` }}>
                          <span style={{ position: "absolute", left: 5, bottom: 4, fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,.55)", borderRadius: 4, padding: "1px 5px" }}>{time}</span>
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scene}</div><div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>{filmName} · {comments} comments</div></div>
                        <button onClick={() => showToast("Opens player at " + time)} style={{ minHeight: 32, padding: "0 12px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)", whiteSpace: "nowrap" }}>Jump</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-secondary)", marginRight: 4 }}>Community feed</span>
                  {feedChipsDef.map(([label, cat]) => (
                    <button key={label} onClick={() => setEngageFilter(cat)} style={{ minHeight: 32, padding: "0 13px", borderRadius: 999, border: "1px solid " + (engageFilter === cat ? "var(--text-primary)" : "var(--border-subtle)"), background: engageFilter === cat ? "var(--surface-3)" : "none", color: engageFilter === cat ? "var(--text-primary)" : "var(--text-secondary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>{label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {feedItems.map(([category, author, ago, title, excerpt, replies, likes]) => (
                    <div key={title} style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid " + (catColor[category] || "var(--text-tertiary)"), borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 4, background: "var(--surface-3)", color: catColor[category] || "var(--text-secondary)" }}>{category}</span><span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{author} · {ago}</span></div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 9 }}>{title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 5, lineHeight: 1.5 }}>{excerpt}</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)" }}><span>💬 {replies}</span><span>♥ {likes}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "funding" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22, animation: "csRise 300ms var(--ease-standard)" }}>
              <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", border: "1px solid var(--border-subtle)" }}>
                <div style={{ position: "absolute", inset: 0, background: bg(3, "30%") }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(16,17,19,.95) 30%, rgba(16,17,19,.4) 100%)" }} />
                <div style={{ position: "relative", padding: "26px 28px", maxWidth: 560 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>Filmmaker marketplace</div>
                  <h2 style={{ margin: "8px 0 6px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Fund your next film. Find your crew.</h2>
                  <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>Connect with investors, producers, crew and festivals — all inside DORIS. Your traction here is your pitch.</p>
                  <div style={{ display: "flex", gap: 10 }}><button onClick={toastFunding} style={{ minHeight: 44, padding: "0 20px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Post a funding request</button><button onClick={toastFunding} style={{ minHeight: 44, padding: "0 20px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Browse opportunities</button></div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {marketCats.map(([title, desc, count, icon]) => (
                  <button key={title} onClick={toastFunding} style={{ textAlign: "left", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 18, cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><Icon name={icon as keyof typeof import("./icons").ICONS} /></span>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>{title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>{desc}</div>
                    <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700, marginTop: 10 }}>{count} →</div>
                  </button>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>Festival opportunities</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {festivals.map((f) => (
                    <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 16, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16 }}>
                      <span style={{ width: 44, height: 44, flex: "none", borderRadius: 10, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏆</span>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700 }}>{f.name}</div><div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{f.detail}</div></div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600, color: f.soon ? "var(--warning)" : "var(--text-tertiary)", whiteSpace: "nowrap" }}>{f.deadline}</span>
                      <button onClick={toastFunding} style={{ minHeight: 38, padding: "0 18px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Apply</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "settings" && (
            <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 14, animation: "csRise 300ms var(--ease-standard)" }}>
              {settingsRows.map((s) => (
                <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 18 }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div><div style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 2 }}>{s.desc}</div></div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: s.on ? "var(--accent-subtle)" : "var(--surface-3)", color: s.on ? "var(--text-primary)" : "var(--text-tertiary)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
