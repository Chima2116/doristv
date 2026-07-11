"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { FilmCard } from "@/components/film/FilmCard";
import { FILMS } from "@/lib/data";
import { chipStyle } from "@/lib/uiStyles";

const GENRES = ["All", "Drama", "Thriller", "Comedy", "Romance", "Family", "Anthology"];
const TIERS = ["All", "Free", "Rent", "Premium"];

export default function BrowsePage() {
  const { searchQ, setSearchQ } = useApp();
  const [genre, setGenre] = useState("All");
  const [tier, setTier] = useState("All");

  const q = searchQ.trim().toLowerCase();
  const films = FILMS.filter((f) =>
    (genre === "All" || f.genre === genre) &&
    (tier === "All" || f.tier === tier.toLowerCase()) &&
    (!q || f.title.toLowerCase().includes(q) || f.creator.toLowerCase().includes(q) || f.genre.toLowerCase().includes(q))
  );

  const clearFilters = () => { setGenre("All"); setTier("All"); setSearchQ(""); };

  return (
    <div style={{ width: "100%", maxWidth: 1360, padding: "28px 32px 56px", display: "flex", flexDirection: "column", gap: 18, animation: "dorisRise 300ms var(--ease-standard)" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, letterSpacing: "-0.02em" }}>Browse</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>{films.length} film{films.length === 1 ? "" : "s"} · every film shows its price before you press play</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {GENRES.map((g) => <button key={g} onClick={() => setGenre(g)} style={chipStyle(genre === g)}>{g}</button>)}
        <span style={{ width: 1, height: 24, background: "var(--border-strong)", margin: "0 6px" }} />
        {TIERS.map((t) => <button key={t} onClick={() => setTier(t)} style={chipStyle(tier === t)}>{t}</button>)}
      </div>

      {films.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "64px 24px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Nothing matches that yet</div>
          <div style={{ fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.5 }}>Try a different spelling, or clear the filters to see the full catalogue.</div>
          <button onClick={clearFilters} style={{ minHeight: 42, padding: "0 20px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Clear search &amp; filters</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 210px)", gap: "44px 28px" }}>
          {films.map((f) => <FilmCard key={f.id} film={f} showTierBadge />)}
        </div>
      )}
    </div>
  );
}
