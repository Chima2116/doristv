"use client";

import { useApp } from "@/lib/store";

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,.55)", fontSize: 13.5, animation: "dorisRise 250ms var(--ease-standard)" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />{toast}
    </div>
  );
}
