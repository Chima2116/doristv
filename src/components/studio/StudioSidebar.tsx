"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./icons";

export type Section = "dashboard" | "films" | "analytics" | "audience" | "revenue" | "comments" | "community" | "funding" | "payouts" | "settings";
export type StudioKey = Section | "upload";

const NAV_DEF: [StudioKey, string, string][] = [
  ["dashboard", "Dashboard", "dashboard"], ["films", "Films", "films"], ["upload", "Upload Film", "upload"],
  ["analytics", "Analytics", "analytics"], ["audience", "Audience", "audience"], ["revenue", "Revenue", "revenue"],
  ["comments", "Comments", "comments"], ["community", "Engagement", "community"], ["funding", "Funding & Collaborations", "funding"],
  ["payouts", "Payouts", "payouts"], ["settings", "Settings", "settings"],
];

/**
 * The dedicated left-hand navigation every Creator Studio screen shares — dashboard,
 * films, upload, etc. Any screen using it renders as `fullScreen` in AppChrome (see
 * `pathname.startsWith("/studio")`), so this sidebar (plus each screen's own header)
 * is the entire chrome; there's no default top NavBar underneath it.
 */
export function StudioSidebar({ activeKey, onSelect }: { activeKey: StudioKey; onSelect: (key: StudioKey) => void }) {
  const router = useRouter();
  return (
    <aside style={{ width: 246, flex: "none", position: "sticky", top: 0, height: "100vh", background: "linear-gradient(180deg,#1E2023 0%,#161719 100%)", borderRight: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", padding: "20px 14px" }}>
      <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 10px 18px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", textAlign: "left", width: "100%" }}>
        <span style={{ display: "inline-flex", color: "var(--text-tertiary)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>DORIS<span style={{ opacity: .55 }}> TV</span></span>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--canvas)", background: "var(--accent)", borderRadius: 4, padding: "3px 6px" }}>Studio</span>
      </button>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_DEF.map(([key, label, icon]) => {
          const active = activeKey === key;
          return (
            <button key={key} onClick={() => onSelect(key)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", minHeight: 40, padding: "0 12px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13.5, fontWeight: active ? 700 : 600, textAlign: "left", background: active ? "var(--accent-subtle)" : "transparent", color: active ? "var(--text-primary)" : "var(--text-secondary)", transition: "all 150ms" }}>
              <Icon name={icon as keyof typeof import("./icons").ICONS} style={{ width: 18, height: 18, flex: "none", display: "inline-flex" }} />
              <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              {key === "comments" && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", background: "var(--accent-subtle)", color: "var(--text-secondary)", borderRadius: 999, padding: "2px 7px" }}>6</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", background: 'url("/films/film-weight-of-water.png") center/cover, var(--surface-3)', boxShadow: "0 0 0 2px var(--accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Kemi Adetiba</div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Verified filmmaker</div>
        </div>
      </div>
    </aside>
  );
}
