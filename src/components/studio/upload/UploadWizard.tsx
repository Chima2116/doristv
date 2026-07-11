"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { useNow } from "@/hooks/useNow";
import {
  AssetKey, CrewMember, UploadDraft, defaultDraft, draftToPublished, emptyAsset, newFilmId,
} from "@/lib/uploadTypes";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AssetsStep } from "./steps/AssetsStep";
import { DetailsStep } from "./steps/DetailsStep";
import { CastCrewStep } from "./steps/CastCrewStep";
import { MonetizationStep } from "./steps/MonetizationStep";
import { CommunityStep } from "./steps/CommunityStep";
import { RightsStep } from "./steps/RightsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { PublishStep } from "./steps/PublishStep";

const DRAFT_KEY = "doris-upload-draft-v1";
const STEP_LABELS = ["Welcome", "Upload assets", "Film details", "Cast & crew", "Monetization", "Community", "Rights", "Preview", "Publish"];

function canAdvance(draft: UploadDraft, step: number): boolean {
  switch (step) {
    case 1: return draft.assets.master.status === "done" && draft.assets.poster.status === "done" && draft.assets.backdrop.status === "done";
    case 2: return draft.title.trim().length > 0 && draft.synopsis.trim().length > 0 && draft.runtimeMinutes !== "" && draft.releaseYear !== "" && draft.genres.length > 0 && draft.languages.length > 0 && !!draft.ageRating;
    case 3: return draft.crew.length > 0;
    case 4: return draft.tier !== "rent" || draft.rentPrice > 0;
    case 6: return draft.rightsConfirmed;
    default: return true;
  }
}

/** blob object URLs never survive a reload, so any asset that had one gets reset to empty
 * instead of showing a broken preview. */
function loadDraft(): UploadDraft {
  if (typeof window === "undefined") return defaultDraft();
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultDraft();
    const parsed: UploadDraft = JSON.parse(raw);
    const assets = { ...parsed.assets };
    (Object.keys(assets) as AssetKey[]).forEach((k) => { if (assets[k].objectUrl) assets[k] = emptyAsset(assets[k].kind); });
    return { ...parsed, assets };
  } catch {
    return defaultDraft();
  }
}

export function UploadWizard() {
  const router = useRouter();
  const { showToast, publishFilm } = useApp();
  const now = useNow(1000);

  // Resume an in-progress draft via a lazy initializer (runs once, synchronously, on first
  // render) rather than restoring in an effect. The very first step rendered (Welcome)
  // doesn't read any draft fields, so resolving this before paint can't cause a
  // server/client hydration mismatch.
  const [draft, setDraft] = useState<UploadDraft>(loadDraft);
  const [step, setStep] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DRAFT_KEY)) showToast("Resumed your draft");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setLastSavedAt(Date.now()); } catch { /* storage full/unavailable */ }
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [draft]);

  // Accepts a plain patch or an updater keyed off the latest state — the latter matters
  // for toggle-style updates (e.g. adding/removing a genre chip) where reading `draft`
  // from a stale render closure can silently drop a change if two toggles land in the
  // same React batch.
  const update = useCallback((patch: Partial<UploadDraft> | ((d: UploadDraft) => Partial<UploadDraft>)) => {
    setDraft((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
  }, []);
  const updateAsset = useCallback((key: AssetKey, patch: Partial<UploadDraft["assets"][AssetKey]>) => {
    setDraft((d) => ({ ...d, assets: { ...d.assets, [key]: { ...d.assets[key], ...patch } } }));
  }, []);

  const handleFile = useCallback((key: AssetKey, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    updateAsset(key, { fileName: file.name, fileSize: file.size, objectUrl, status: "uploading", progress: 0 });
    let p = 0;
    const timer = setInterval(() => {
      p = Math.min(100, p + Math.random() * 22 + 12);
      if (p >= 100) { clearInterval(timer); updateAsset(key, { progress: 100, status: "done" }); }
      else updateAsset(key, { progress: p });
    }, 200);
  }, [updateAsset]);

  const removeAsset = useCallback((key: AssetKey) => {
    setDraft((d) => {
      const cur = d.assets[key];
      if (cur.objectUrl) URL.revokeObjectURL(cur.objectUrl);
      return { ...d, assets: { ...d.assets, [key]: emptyAsset(cur.kind) } };
    });
  }, []);

  const addCrew = useCallback((m: CrewMember) => setDraft((d) => ({ ...d, crew: [...d.crew, m] })), []);
  const removeCrew = useCallback((id: string) => setDraft((d) => ({ ...d, crew: d.crew.filter((c) => c.id !== id) })), []);

  const finish = useCallback((status: "published" | "scheduled" | "draft", scheduledAt: number | null) => {
    const film = draftToPublished({ ...draft, scheduledAt }, newFilmId(), status);
    publishFilm(film);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    showToast(status === "published" ? "Your film is live on DORIS TV" : status === "scheduled" ? "Release scheduled" : "Draft saved to your Films list");
    router.push(status === "draft" ? "/studio" : `/studio/films/${film.id}`);
  }, [draft, publishFilm, router, showToast]);

  const exit = () => { showToast("Draft saved — resume anytime from Upload film"); router.push("/studio"); };

  const valid = canAdvance(draft, step);
  const isLast = step === STEP_LABELS.length - 1;
  const goNext = () => { if (valid && !isLast) setStep((s) => Math.min(STEP_LABELS.length - 1, s + 1)); };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const savedLabel = useMemo(() => {
    if (!lastSavedAt) return "Not saved yet";
    const secs = Math.max(0, Math.floor((now - lastSavedAt) / 1000));
    if (secs < 3) return "Saved";
    if (secs < 60) return `Saved ${secs}s ago`;
    return `Saved ${Math.floor(secs / 60)}m ago`;
  }, [now, lastSavedAt]);

  const nextLabel = step === 0 ? "Begin" : step === 6 ? "Continue to preview" : "Continue";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(22,23,25,.85)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <button onClick={exit} aria-label="Save & exit" title="Save & exit" style={{ width: 38, height: 38, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", borderRadius: "50%", background: "var(--surface-1)", color: "var(--text-primary)", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}</div>
            <div style={{ marginTop: 8, height: 3, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(step / (STEP_LABELS.length - 1)) * 100}%`, background: "#fff", borderRadius: 999, transition: "width 400ms var(--ease-standard)" }} />
            </div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: lastSavedAt ? "var(--success)" : "var(--text-disabled)" }} />
            {savedLabel}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div key={step} style={{ animation: "dorisRise 320ms var(--ease-standard) both" }}>
          {step === 0 && <WelcomeStep creatorName="Kemi" />}
          {step === 1 && <AssetsStep assets={draft.assets} onFile={handleFile} onRemove={removeAsset} />}
          {step === 2 && <DetailsStep draft={draft} update={update} />}
          {step === 3 && <CastCrewStep crew={draft.crew} onAdd={addCrew} onRemove={removeCrew} />}
          {step === 4 && <MonetizationStep draft={draft} update={update} />}
          {step === 5 && <CommunityStep community={draft.community} update={(patch) => update({ community: { ...draft.community, ...patch } })} />}
          {step === 6 && <RightsStep draft={draft} update={update} />}
          {step === 7 && <PreviewStep draft={draft} />}
          {step === 8 && (
            <PublishStep
              draft={draft}
              onPublish={() => finish("published", null)}
              onSchedule={(whenISO) => finish("scheduled", new Date(whenISO).getTime())}
              onSaveDraft={() => finish("draft", null)}
            />
          )}
        </div>
      </main>

      {!isLast && (
        <div style={{ position: "sticky", bottom: 0, zIndex: 20, background: "rgba(22,23,25,.9)", backdropFilter: "blur(14px)", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 32px", maxWidth: 1200, margin: "0 auto" }}>
            <button onClick={goBack} disabled={step === 0} style={{ background: "none", border: "none", color: step === 0 ? "var(--text-disabled)" : "var(--text-secondary)", fontSize: 14, fontWeight: 700, cursor: step === 0 ? "not-allowed" : "pointer" }}>← Back</button>
            <button
              onClick={goNext}
              disabled={!valid}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 50, padding: "0 30px", border: "none", borderRadius: 999, background: valid ? "#fff" : "rgba(255,255,255,.1)", color: valid ? "#1A1B1E" : "var(--text-disabled)", fontWeight: 800, fontSize: 14.5, cursor: valid ? "pointer" : "not-allowed", fontFamily: "var(--font-ui)" }}
            >
              {nextLabel} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
