"use client";

import { ReactNode } from "react";

const CHECKLIST: { title: string; desc: string; icon: ReactNode }[] = [
  { title: "Film master", desc: "Your finished film, full quality — MP4 or MOV.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m10 9 5 3-5 3z" /></svg> },
  { title: "Poster", desc: "Portrait key art — the face of your film across DORIS.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /></svg> },
  { title: "Backdrop", desc: "A widescreen still for the homepage and your title page.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="10" r="1.5" /><path d="m4 17 5-5 4 4 3-3 4 4" /></svg> },
  { title: "Synopsis & details", desc: "Title, runtime, genre, language, and a synopsis that sells it.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  { title: "Cast & crew credits", desc: "Directors, writers, producers, cast — who made this happen.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { title: "Rights confirmation", desc: "Confirmation you own or have licensed everything in the film.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></svg> },
];

export function WelcomeStep({ creatorName }: { creatorName: string }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 32px 64px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Creator Studio · Release</span>
      <h1 style={{ margin: "14px 0 0", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
        Let&rsquo;s release<br />your film, {creatorName.split(" ")[0]}.
      </h1>
      <p style={{ margin: "18px 0 0", fontSize: 16.5, lineHeight: 1.65, color: "var(--text-secondary)", maxWidth: 480 }}>
        This isn&rsquo;t a video upload — it&rsquo;s a premiere. Take your time through each step; everything autosaves as you go, so you can always pick up where you left off.
      </p>

      <div style={{ width: "100%", marginTop: 52, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>What you&rsquo;ll need</span>
        {CHECKLIST.map((c) => (
          <div key={c.title} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 4px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ width: 42, height: 42, flex: "none", borderRadius: "50%", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>{c.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <span style={{ marginTop: 32, fontSize: 12.5, color: "var(--text-tertiary)" }}>Takes about 10 minutes · every film is reviewed by a person before it goes live</span>
    </div>
  );
}
