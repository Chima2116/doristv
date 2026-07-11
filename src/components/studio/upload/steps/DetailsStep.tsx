"use client";

import { AGE_RATINGS, COUNTRIES, GENRES, LANGUAGES, UploadDraft } from "@/lib/uploadTypes";
import { ChipPicker, FieldLabel, StepHeader, fieldWrap, headlineInputStyle, inputStyle, textareaStyle } from "../ui";

type Update = (patch: Partial<UploadDraft> | ((d: UploadDraft) => Partial<UploadDraft>)) => void;

export function DetailsStep({ draft, update }: { draft: UploadDraft; update: Update }) {
  const toggleIn = (key: "genres" | "languages", value: string) => {
    update((d) => ({ [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value] }));
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 32px 64px" }}>
      <StepHeader eyebrow="Step 3 of 9" title="Tell us about the film" sub="The title and synopsis are the first thing anyone sees — make them count." />

      <div style={fieldWrap}>
        <input
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Your film's title"
          style={headlineInputStyle}
        />
      </div>

      <div style={fieldWrap}>
        <FieldLabel hint="One or two sentences that sell the film — this appears on your title page.">Synopsis</FieldLabel>
        <textarea value={draft.synopsis} onChange={(e) => update({ synopsis: e.target.value })} placeholder="A fisherman's daughter returns to Makoko with a secret the lagoon won't keep…" style={textareaStyle} />
        <span style={{ alignSelf: "flex-end", fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 6, fontFamily: "var(--font-mono)" }}>{draft.synopsis.length} characters</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={fieldWrap}>
          <FieldLabel>Runtime (minutes)</FieldLabel>
          <input type="number" min={1} value={draft.runtimeMinutes} onChange={(e) => update({ runtimeMinutes: e.target.value })} placeholder="98" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <FieldLabel>Release year</FieldLabel>
          <input type="number" value={draft.releaseYear} onChange={(e) => update({ releaseYear: e.target.value })} style={inputStyle} />
        </div>
      </div>

      <div style={fieldWrap}>
        <FieldLabel>Genres</FieldLabel>
        <ChipPicker options={GENRES} selected={draft.genres} onToggle={(v) => toggleIn("genres", v)} />
      </div>

      <div style={fieldWrap}>
        <FieldLabel>Languages</FieldLabel>
        <ChipPicker options={LANGUAGES} selected={draft.languages} onToggle={(v) => toggleIn("languages", v)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={fieldWrap}>
          <FieldLabel>Country</FieldLabel>
          <select value={draft.country} onChange={(e) => update({ country: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <FieldLabel>Age rating</FieldLabel>
          <ChipPicker options={AGE_RATINGS} selected={draft.ageRating ? [draft.ageRating] : []} onToggle={(v) => update({ ageRating: v })} multi={false} />
        </div>
      </div>
    </div>
  );
}
