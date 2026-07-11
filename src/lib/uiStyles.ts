import { CSSProperties } from "react";
import { naira } from "@/lib/format";
import type { Film } from "@/lib/data";

export function chipStyle(active: boolean): CSSProperties {
  return {
    minHeight: 36, padding: "0 16px", borderRadius: 999, cursor: "pointer",
    fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600,
    border: "1px solid " + (active ? "var(--accent)" : "var(--border-subtle)"),
    background: active ? "var(--accent-subtle)" : "var(--surface-1)",
    color: active ? "var(--accent)" : "var(--text-secondary)",
  };
}

export function segStyle(active: boolean): CSSProperties {
  return {
    minHeight: 32, padding: "0 14px", border: "none", borderRadius: 999, cursor: "pointer",
    fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
    transition: "all 150ms",
  };
}

export function navStyle(active: boolean): CSSProperties {
  return {
    background: active ? "rgba(255,255,255,0.07)" : "none", border: "none", cursor: "pointer",
    padding: "9px 14px", borderRadius: 999, color: active ? "var(--text-primary)" : "var(--text-secondary)",
    fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: active ? 700 : 600, whiteSpace: "nowrap",
  };
}

export function tierBadge(f: Film, abs: boolean): { style: CSSProperties; label: string } {
  const base: CSSProperties = {
    fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase",
    borderRadius: 4, padding: "3px 8px", display: "inline-flex", alignSelf: "flex-start",
  };
  if (abs) Object.assign(base, { position: "absolute", top: 8, left: 8 });
  if (f.tier === "rent") return { style: { ...base, background: "var(--tier-rent-bg)", color: "var(--tier-rent-text)" }, label: naira(f.price || 0) + " Rent" };
  if (f.tier === "premium") return { style: { ...base, background: "var(--tier-premium-bg)", color: "var(--tier-premium-text)" }, label: "Premium" };
  return { style: { ...base, background: "rgba(11,14,17,0.6)", color: "var(--tier-free-text)", border: "1px solid var(--border-strong)" }, label: "Free" };
}
