"use client";

import { useState } from "react";
import { CREW_ROLES, CrewMember, CrewRole } from "@/lib/uploadTypes";
import { ChipPicker, PrimaryButton, StepHeader, inputStyle } from "../ui";
import { initials } from "@/lib/format";

function CrewCard({ member, onRemove }: { member: CrewMember; onRemove: () => void }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "26px 16px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
      <button onClick={onRemove} aria-label={`Remove ${member.name}`} style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: "50%", border: "none", background: "var(--surface-2)", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface-3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{initials(member.name)}</span>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{member.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{member.role}{member.character ? ` · ${member.character}` : ""}</div>
      </div>
    </div>
  );
}

export function CastCrewStep({ crew, onAdd, onRemove }: { crew: CrewMember[]; onAdd: (m: CrewMember) => void; onRemove: (id: string) => void }) {
  const [adding, setAdding] = useState(crew.length === 0);
  const [name, setName] = useState("");
  const [role, setRole] = useState<CrewRole>("Director");
  const [character, setCharacter] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()), name: name.trim(), role, character: role === "Cast" ? character.trim() || undefined : undefined });
    setName(""); setCharacter(""); setRole("Director");
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 4 of 9" title="Cast & crew" sub="Add the people who made this film — as individual credits, not one long list to fill in." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
        {crew.map((m) => <CrewCard key={m.id} member={m} onRemove={() => onRemove(m.id)} />)}

        {!adding && (
          <button onClick={() => setAdding(true)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 168, borderRadius: "var(--radius-lg)", cursor: "pointer", background: "none", border: "1px dashed var(--border-strong)", color: "var(--text-secondary)", fontFamily: "var(--font-ui)" }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Add person</span>
          </button>
        )}
      </div>

      {adding && (
        <div style={{ marginTop: 20, padding: 24, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: 18, animation: "dorisRise 220ms var(--ease-standard) both" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} autoFocus />
          <ChipPicker options={CREW_ROLES} selected={[role]} onToggle={(v) => setRole(v as CrewRole)} multi={false} />
          {role === "Cast" && (
            <input value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="Character name (optional)" style={inputStyle} />
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton onClick={submit} disabled={!name.trim()} style={{ minHeight: 44, fontSize: 13.5 }}>Add to credits</PrimaryButton>
            {crew.length > 0 && (
              <button onClick={() => { setAdding(false); setName(""); setCharacter(""); }} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            )}
          </div>
        </div>
      )}

      {crew.length === 0 && !adding && (
        <p style={{ marginTop: 20, fontSize: 12.5, color: "var(--text-tertiary)" }}>Add at least a director to continue.</p>
      )}
    </div>
  );
}
