"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { naira } from "@/lib/format";
import { chipStyle } from "@/lib/uiStyles";
import { StudioSidebar } from "@/components/studio/StudioSidebar";

type FileState = "none" | "uploading" | "done";
type Tier = "free" | "rent" | "premium";

const GENRES = ["Drama", "Thriller", "Comedy", "Romance", "Family", "Anthology", "Documentary"];
const PRICES = [500, 800, 1000, 1500];
const STEPS = [{ n: 1, label: "Film & details" }, { n: 2, label: "Pricing" }, { n: 3, label: "Review" }];

export default function UploadPage() {
  const router = useRouter();
  const { addUpload, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [fileState, setFileState] = useState<FileState>("none");
  const [pct, setPct] = useState(0);
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [poster, setPoster] = useState(false);
  const [tier, setTier] = useState<Tier>("rent");
  const [price, setPrice] = useState(800);
  const [rights, setRights] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const pickFile = () => {
    if (fileState !== "none") return;
    setFileState("uploading");
    setPct(0);
    timer.current = setInterval(() => {
      setPct((p) => {
        const next = Math.min(100, p + 9);
        if (next >= 100) { if (timer.current) clearInterval(timer.current); setFileState("done"); }
        return next;
      });
    }, 180);
  };

  const canNext1 = fileState === "done" && title.trim().length > 0;
  const tierNames: Record<Tier, string> = { free: "Free with ads", rent: "Rent · " + naira(price) + " · 48hr", premium: "Premium catalogue" };

  const submit = () => {
    if (!rights) return;
    showToast("Submitted — a reviewer will pick it up shortly");
    addUpload(title.trim());
    setStep(4);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--canvas)", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
      <StudioSidebar activeKey="upload" onSelect={(key) => { if (key !== "upload") router.push("/studio"); }} />

      <main className="cs-scroll" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 20, padding: "18px 34px", background: "rgba(22,23,25,.82)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-subtle)" }}>
          <button onClick={() => router.push("/studio")} aria-label="Back to Studio" title="Back to Studio" style={{ width: 38, height: 38, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", borderRadius: "50%", background: "var(--surface-1)", color: "var(--text-primary)", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Creator Studio</div>
            <h1 style={{ margin: "2px 0 0", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>Upload a film</h1>
          </div>
        </header>

        <div style={{ maxWidth: 760, padding: "28px 34px 64px", display: "flex", flexDirection: "column", gap: 20, animation: "dorisRise 300ms var(--ease-standard)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Every film is reviewed by a person — most decisions land within 48 hours.</p>

          {step < 4 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {STEPS.map((st, i) => {
            const active = step === st.n, done = step > st.n;
            return (
              <div key={st.n} style={{ display: "contents" }}>
                <span style={{ width: 28, height: 28, flex: "none", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, fontFamily: "var(--font-ui)", background: done ? "var(--success-subtle)" : active ? "var(--accent)" : "var(--surface-1)", color: done ? "var(--success)" : active ? "var(--text-on-accent)" : "var(--text-tertiary)", border: active || done ? "none" : "1px solid var(--border-strong)" }}>{done ? "✓" : st.n}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: active ? "var(--text-primary)" : "var(--text-tertiary)", whiteSpace: "nowrap" }}>{st.label}</span>
                {i < 2 && <span style={{ flex: 1, height: 2, background: done ? "var(--success)" : "var(--border-subtle)", borderRadius: 2 }} />}
              </div>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button onClick={pickFile} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 110, padding: 18, borderRadius: 12, cursor: fileState === "none" ? "pointer" : "default", fontFamily: "var(--font-ui)", background: fileState === "done" ? "var(--surface-1)" : "transparent", border: fileState === "done" ? "1px solid var(--border-subtle)" : "2px dashed var(--border-strong)", color: "var(--text-secondary)" }}>
            {(fileState === "none" || fileState === "uploading") && (
              <>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Tap to choose your film file</span>
                <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>MP4 or MOV · up to 8GB · we transcode for 3G automatically</span>
              </>
            )}
            {fileState === "done" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-subtle)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /></svg></span>
                <span style={{ textAlign: "left" }}><span style={{ display: "block", fontSize: 14, fontWeight: 700 }}>the_tide_master_v3.mp4</span><span style={{ display: "block", fontSize: 12, color: "var(--success)", fontFamily: "var(--font-mono)" }}>4.2GB · upload complete ✓</span></span>
              </span>
            )}
          </button>
          {fileState === "uploading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-mono)" }}><span style={{ color: "var(--text-secondary)" }}>Uploading…</span><span style={{ color: "var(--accent)" }}>{pct}%</span></div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden" }}><div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 999, transition: "width 180ms linear" }} /></div>
              <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Uploads resume automatically if your connection drops.</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your film's title" style={{ minHeight: 44, background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "0 14px", fontSize: 14, color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-ui)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1/-1" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Logline <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>— one sentence that sells the film</span></span>
              <textarea value={logline} onChange={(e) => setLogline(e.target.value)} rows={2} placeholder="A fisherman's daughter returns to Makoko with a secret…" style={{ resize: "none", background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "var(--text-primary)", outline: "none", lineHeight: 1.5, fontFamily: "var(--font-ui)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Genre</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {GENRES.map((g) => <button key={g} onClick={() => setGenre(g)} style={chipStyle(genre === g)}>{g}</button>)}
              </div>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Poster</span>
              <button onClick={() => setPoster(true)} style={{ minHeight: 44, borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-ui)", background: "var(--surface-1)", border: poster ? "1px solid var(--border-subtle)" : "1px dashed var(--border-strong)" }}>
                {!poster ? <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>+ Add poster (2:3)</span> : <span style={{ fontSize: 12, color: "var(--success)", fontFamily: "var(--font-mono)" }}>poster_final.jpg ✓</span>}
              </button>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => canNext1 && setStep(2)} style={{ minHeight: 44, padding: "0 24px", border: "none", borderRadius: 999, fontWeight: 800, fontSize: 14, fontFamily: "var(--font-ui)", cursor: canNext1 ? "pointer" : "not-allowed", background: canNext1 ? "var(--accent)" : "rgba(255,255,255,.08)", color: canNext1 ? "var(--text-on-accent)" : "var(--text-tertiary)" }}>Continue → Pricing</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {(["free", "rent", "premium"] as Tier[]).map((t) => {
              const active = tier === t;
              const card = { display: "flex", flexDirection: "column" as const, textAlign: "left" as const, padding: 16, borderRadius: 12, cursor: "pointer" as const, fontFamily: "var(--font-ui)", background: active ? "var(--accent-subtle)" : "var(--surface-1)", border: "1px solid " + (active ? "var(--accent)" : "var(--border-subtle)"), color: "var(--text-primary)", transition: "all 150ms" };
              return (
                <button key={t} onClick={() => setTier(t)} style={card}>
                  {t === "free" && (<><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "rgba(255,255,255,.1)", borderRadius: 4, padding: "3px 9px", alignSelf: "flex-start" }}>Free</span><span style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>Free with ads</span><span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>Widest reach. You earn <b style={{ color: "var(--success)" }}>60% of ad revenue</b> on your film.</span></>)}
                  {t === "rent" && (<><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "var(--tier-rent-bg)", color: "var(--tier-rent-text)", borderRadius: 4, padding: "3px 9px", alignSelf: "flex-start" }}>Rent</span><span style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>48-hour rental</span><span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>You set the price. You keep <b style={{ color: "var(--success)" }}>70% of every rental</b>.</span></>)}
                  {t === "premium" && (<><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "var(--tier-premium-bg)", color: "var(--tier-premium-text)", borderRadius: 4, padding: "3px 9px", alignSelf: "flex-start" }}>Premium</span><span style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>Subscription catalogue</span><span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>Paid from the premium pool by <b style={{ color: "var(--success)" }}>watch time</b>.</span></>)}
                </button>
              );
            })}
          </div>

          {tier === "rent" && (
            <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Rental price</span>
              <div style={{ display: "flex", gap: 8 }}>
                {PRICES.map((p) => <button key={p} onClick={() => setPrice(p)} style={chipStyle(price === p)}>{naira(p)}</button>)}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Per rental, you receive</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--success)" }}>{naira(Math.round(price * 0.7))} (70%)</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ minHeight: 44, padding: "0 20px", background: "none", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ minHeight: 44, padding: "0 24px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Continue → Review</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 18, display: "flex", gap: 16 }}>
            <span style={{ width: 84, aspectRatio: "2/3", borderRadius: 6, background: "linear-gradient(135deg,#1d2a30 0%,#2a3a40 60%,#3a3020 100%)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--text-tertiary)" }}>poster</span>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{title || "Untitled film"}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{logline || "—"}</span>
              <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--text-tertiary)", flexWrap: "wrap" }}>
                <span>{genre}</span><span>·</span><span>the_tide_master_v3.mp4</span><span>·</span><span style={{ color: "var(--accent)", fontWeight: 700 }}>{tierNames[tier]}</span>
              </div>
            </div>
          </div>
          <div style={{ background: "var(--info-subtle)", border: "1px solid rgba(91,155,213,.3)", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.55, color: "var(--text-secondary)" }}>
            <b style={{ color: "var(--info)" }}>What happens next:</b> a human reviewer checks every submission — quality, rights, and content guidelines. Most decisions land within <b style={{ color: "var(--text-primary)" }}>48 hours</b>. If something needs a fix, we return it with specific notes, never a silent rejection.
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)", cursor: "pointer" }}>
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: "#FFFFFF" }} />
            <span>I own or have licensed all rights to this film — footage, music, and performances — and can prove it if asked.</span>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ minHeight: 44, padding: "0 20px", background: "none", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--text-secondary)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>← Back</button>
            <button onClick={submit} style={{ minHeight: 46, padding: "0 26px", border: "none", borderRadius: 999, fontWeight: 800, fontSize: 14, fontFamily: "var(--font-ui)", cursor: rights ? "pointer" : "not-allowed", background: rights ? "var(--accent)" : "rgba(255,255,255,.08)", color: rights ? "var(--text-on-accent)" : "var(--text-tertiary)" }}>Submit for review</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, padding: "44px 24px" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--success-subtle)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{title || "Your film"} is in review</div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.55, maxWidth: 380 }}>We&rsquo;ll notify you within 48 hours. You can keep editing details until a reviewer picks it up.</p>
          <button onClick={() => router.push("/studio")} style={{ minHeight: 46, padding: "0 24px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 4 }}>Back to Studio</button>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
