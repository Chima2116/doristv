"use client";

import { CSSProperties, ReactNode } from "react";

/** Shared visual language for every step in the Upload wizard — generous whitespace,
 * quiet borderless inputs, big display type for headlines. Kept in one place so the
 * nine steps read as one considered flow rather than nine separate forms. */

export function StepHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 44 }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{eyebrow}</span>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(32px,4vw,44px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>{title}</h1>
      {sub && <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 560 }}>{sub}</p>}
    </div>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{children}</span>
      {hint && <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{hint}</span>}
    </span>
  );
}

export const fieldWrap: CSSProperties = { display: "flex", flexDirection: "column", marginBottom: 28 };

export const inputStyle: CSSProperties = {
  width: "100%", minHeight: 50, background: "var(--surface-1)", border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-md)", padding: "0 16px", fontSize: 15, color: "var(--text-primary)",
  outline: "none", fontFamily: "var(--font-ui)", transition: "border-color 150ms var(--ease-standard)",
};

export const headlineInputStyle: CSSProperties = {
  width: "100%", background: "none", border: "none", borderBottom: "1px solid var(--border-strong)",
  padding: "0 0 14px", fontSize: "clamp(28px,3.4vw,40px)", fontWeight: 800, fontFamily: "var(--font-display)",
  color: "var(--text-primary)", outline: "none", letterSpacing: "-0.01em",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle, minHeight: 140, padding: "14px 16px", lineHeight: 1.6, resize: "vertical" as const,
};

export function ChipPicker({ options, selected, onToggle, multi = true }: { options: string[]; selected: string[]; onToggle: (v: string) => void; multi?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            style={{
              minHeight: 40, padding: "0 18px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)",
              fontSize: 13.5, fontWeight: 700, border: "1px solid " + (active ? "var(--accent)" : "var(--border-subtle)"),
              background: active ? "#fff" : "var(--surface-1)", color: active ? "#1A1B1E" : "var(--text-secondary)",
              transition: "all 150ms var(--ease-standard)",
            }}
          >
            {multi && active ? "✓ " : ""}{o}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 46, height: 28, flex: "none", borderRadius: 999, border: "none", cursor: "pointer", padding: 3,
        background: on ? "#fff" : "var(--surface-3)", transition: "background 200ms var(--ease-standard)", position: "relative",
      }}
    >
      <span style={{ display: "block", width: 22, height: 22, borderRadius: "50%", background: on ? "#1A1B1E" : "var(--text-secondary)", transform: on ? "translateX(18px)" : "translateX(0)", transition: "transform 200ms var(--ease-standard), background 200ms var(--ease-standard)" }} />
    </button>
  );
}

export function ToggleRow({ icon, title, desc, on, onChange }: { icon: ReactNode; title: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 24px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
      <span style={{ width: 44, height: 44, flex: "none", borderRadius: "50%", background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style }: { children: ReactNode; onClick?: () => void; disabled?: boolean; style?: CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 52, padding: "0 30px",
        border: "none", borderRadius: 999, background: disabled ? "rgba(255,255,255,.1)" : "#fff",
        color: disabled ? "var(--text-disabled)" : "#1A1B1E", fontWeight: 800, fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-ui)", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, style }: { children: ReactNode; onClick?: () => void; disabled?: boolean; style?: CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 52, padding: "0 26px",
        border: "1px solid var(--border-strong)", borderRadius: 999, background: "none",
        color: disabled ? "var(--text-disabled)" : "var(--text-primary)", fontWeight: 700, fontSize: 14.5,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-ui)", ...style,
      }}
    >
      {children}
    </button>
  );
}

export function bytesToSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return v.toFixed(1) + " " + units[i];
}
