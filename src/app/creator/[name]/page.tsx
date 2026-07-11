"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { FilmCard } from "@/components/film/FilmCard";
import { FILMS, initials, CREATOR_DB } from "@/lib/data";

const ACTIVITY = [
  { timeLabel: "42:10", text: "“We waited three days on that shoreline for this exact light.”", film: "The Weight of Water", at: 2530, filmId: 1 },
  { timeLabel: "24:50", text: "“The market scene was one take — the vendors are real traders.”", film: "The Weight of Water", at: 1490, filmId: 1 },
];

export default function CreatorProfilePage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { followedSet, toggleFollow } = useApp();
  const { router, openPlayer } = useFilmActions();

  const data = CREATOR_DB[name] || { bio: "Independent filmmaker on DORIS.", followers: "—" };
  const films = FILMS.filter((f) => f.creator === name);
  const following = !!followedSet[name];
  const commentTotal = films.reduce((a, f) => a + f.comments, 0);

  return (
    <div style={{ width: "100%", maxWidth: 1100, padding: "28px 32px 56px", display: "flex", flexDirection: "column", gap: 26, animation: "dorisRise 300ms var(--ease-standard)" }}>
      <section style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg, rgba(255,255,255,.14) 0%, rgba(255,255,255,.03) 45%, transparent 100%)", border: "1px solid var(--border-subtle)", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <span style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 3px var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{initials(name)}</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, letterSpacing: "-0.02em" }}>{name}</h1>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "3px 8px" }}>Filmmaker</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-secondary)" }}>{data.bio}</p>
            <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 13, color: "var(--text-secondary)", flexWrap: "wrap" }}>
              <span><b style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{films.length}</b> films</span>
              <span><b style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{data.followers}</b> followers</span>
              <span><b style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{commentTotal}</b> comments on their films</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => toggleFollow(name)} style={{ minHeight: 44, padding: "0 24px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 800, background: following ? "rgba(255,255,255,.1)" : "var(--accent)", color: following ? "var(--text-primary)" : "var(--text-on-accent)" }}>{following ? "Following" : "Follow"}</button>
            <button onClick={() => router.push("/community")} style={{ minHeight: 44, padding: "0 20px", background: "none", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>See forum posts</button>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 700 }}>Films by {name}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 240px)", gap: "20px 12px" }}>
          {films.map((f) => <FilmCard key={f.id} film={f} showTierBadge />)}
        </div>
      </section>

      <section style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent)" }}>In the conversation</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>· recent replies to viewers</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIVITY.map((a, i) => (
            <button key={i} onClick={() => openPlayer(a.filmId, a.at)} style={{ display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", background: "var(--accent-subtle)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 10, padding: 12, cursor: "pointer", fontFamily: "var(--font-ui)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "rgba(255,255,255,.14)", borderRadius: 4, padding: "2px 7px", flex: "none" }}>▸ {a.timeLabel}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.45 }}>{a.text}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 3 }}>on {a.film}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
