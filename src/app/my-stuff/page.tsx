"use client";

import { CSSProperties, useState } from "react";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { useNow } from "@/hooks/useNow";
import { film, rating, Film } from "@/lib/data";
import { chipStyle, segStyle } from "@/lib/uiStyles";
import { FilmCard } from "@/components/film/FilmCard";

type Tab = "later" | "rentals" | "downloads";
type Filter = "All" | "Movies" | "Short Films" | "Free" | "Premium";
type Sort = "recent" | "title" | "rating";

const SHORT_IDS: Record<number, boolean> = { 5: true, 7: true };
const DOWNLOAD_IDS = [6, 4];

const badgeChip = (color: string): CSSProperties => ({
  position: "absolute", top: 10, left: 10, zIndex: 2, display: "inline-flex", alignItems: "center", gap: 5,
  fontSize: 10.5, fontWeight: 700, color, background: "rgba(10,11,13,.75)", borderRadius: 3,
  padding: "4px 9px", backdropFilter: "blur(6px)",
});

function matchFilter(f: Film, filter: Filter) {
  if (filter === "All") return true;
  if (filter === "Movies") return !SHORT_IDS[f.id];
  if (filter === "Short Films") return !!SHORT_IDS[f.id];
  if (filter === "Free") return f.tier === "free";
  if (filter === "Premium") return f.tier !== "free";
  return true;
}
function sortIds(ids: number[], sort: Sort) {
  const a = ids.slice();
  if (sort === "title") a.sort((x, y) => film(x).title.localeCompare(film(y).title));
  else if (sort === "rating") a.sort((x, y) => Number(rating(film(y))) - Number(rating(film(x))));
  return a;
}

function EmptyBlock({ title, body, cta, onCta }: { title: string; body: string; cta: string; onCta: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "80px 24px", background: "linear-gradient(135deg, var(--surface-1), rgba(33,35,39,.4))", border: "1px solid var(--border-subtle)", borderRadius: 20 }}>
      <div style={{ width: 66, height: 66, borderRadius: "50%", background: "var(--surface-2)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 360, lineHeight: 1.6 }}>{body}</div>
      <button onClick={onCta} style={{ minHeight: 46, padding: "0 24px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer", marginTop: 6 }}>{cta}</button>
    </div>
  );
}

const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, 240px)", gap: "20px 12px" };

export default function MyStuffPage() {
  const { router } = useFilmActions();
  const { watchLater, rented } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("later");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<Sort>("recent");
  const [sortMenu, setSortMenu] = useState(false);

  const laterIds = sortIds(watchLater.filter((id) => matchFilter(film(id), filter)), sort);
  const rentalIds = sortIds(Object.keys(rented).map(Number).filter((id) => matchFilter(film(id), filter)), sort);
  const downloadIds = sortIds(DOWNLOAD_IDS.filter((id) => matchFilter(film(id), filter)), sort);

  const mySortLabels: Record<Sort, string> = { recent: "Recently added", title: "Alphabetical", rating: "Top rated" };

  return (
    <div style={{ width: "100%", maxWidth: 1180, margin: "0 auto", padding: "32px 32px 64px", display: "flex", flexDirection: "column", gap: 22, animation: "dorisRise 300ms var(--ease-standard)" }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38, letterSpacing: "-0.02em" }}>My Stuff</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>Your personal cinema — saved, rented, and ready to watch offline.</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 999, padding: 4 }}>
          <button onClick={() => { setTab("later"); setFilter("All"); }} style={segStyle(tab === "later")}>Watch Later · {watchLater.length}</button>
          <button onClick={() => { setTab("rentals"); setFilter("All"); }} style={segStyle(tab === "rentals")}>Rentals · {Object.keys(rented).length}</button>
          <button onClick={() => { setTab("downloads"); setFilter("All"); }} style={segStyle(tab === "downloads")}>Downloads · {DOWNLOAD_IDS.length}</button>
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <button onClick={() => setSortMenu((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 38, padding: "0 14px", border: "1px solid var(--border-strong)", borderRadius: 999, cursor: "pointer", background: sortMenu ? "var(--surface-2)" : "none", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12M3 12h9M3 18h6" /></svg>{mySortLabels[sort]}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {sortMenu && (
            <div style={{ position: "absolute", top: 44, right: 0, width: 180, padding: 6, borderRadius: 12, background: "var(--surface-3)", border: "1px solid var(--border-strong)", boxShadow: "0 18px 50px rgba(0,0,0,.5)", zIndex: 20, animation: "dorisRise 150ms var(--ease-standard)" }}>
              {(["recent", "title", "rating"] as Sort[]).map((k) => (
                <button key={k} onClick={() => { setSort(k); setSortMenu(false); }} style={{ display: "block", width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: sort === k ? "rgba(255,255,255,.1)" : "transparent", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: sort === k ? 700 : 600, textAlign: "left" }}>{mySortLabels[k]}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["All", "Movies", "Short Films", "Free", "Premium"] as Filter[]).map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={chipStyle(filter === c)}>{c}</button>
        ))}
      </div>

      {tab === "later" && (
        laterIds.length === 0 ? (
          <EmptyBlock title="Your collection starts here" body="Save films to watch later — tap “+ Watch Later” on any film and build your personal library." cta="Browse films" onCta={() => router.push("/browse")} />
        ) : (
          <div style={gridStyle}>
            {laterIds.map((id) => <FilmCard key={id} film={film(id)} showTierBadge />)}
          </div>
        )
      )}

      {tab === "rentals" && (
        rentalIds.length === 0 ? (
          <EmptyBlock title="No active rentals" body="Rented films appear here with their 48-hour window. 70% of every rental goes straight to the filmmaker." cta="Browse films to rent" onCta={() => router.push("/browse")} />
        ) : (
          <div style={gridStyle}>
            {rentalIds.map((id) => {
              const remain = Math.max(0, 48 * 3600 - Math.floor((now - rented[id]) / 1000));
              const h = Math.floor(remain / 3600), m = Math.floor((remain % 3600) / 60);
              const left = h + "h " + String(m).padStart(2, "0") + "m";
              const badge = (
                <span style={badgeChip("var(--warning)")}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{left} left
                </span>
              );
              return <FilmCard key={id} film={film(id)} topLeftBadge={badge} />;
            })}
          </div>
        )
      )}

      {tab === "downloads" && (
        downloadIds.length === 0 ? (
          <EmptyBlock title="Download for the road" body="Save films to your device and watch offline — perfect for patchy networks. Look for the download icon on any film you've rented or that's free." cta="Find films to download" onCta={() => router.push("/browse")} />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
              <span style={{ width: 36, height: 36, flex: "none", borderRadius: 10, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>Offline library</div><div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>{DOWNLOAD_IDS.length} films · 2.1 GB used · 12.4 GB free</div></div>
              <div style={{ width: 140, height: 6, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}><div style={{ height: "100%", width: "22%", background: "var(--accent)" }} /></div>
            </div>
            <div style={{ ...gridStyle, marginTop: 28 }}>
              {downloadIds.map((id) => {
                const badge = (
                  <span style={badgeChip("var(--success)")}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Downloaded
                  </span>
                );
                return <FilmCard key={id} film={film(id)} topLeftBadge={badge} />;
              })}
            </div>
          </>
        )
      )}
    </div>
  );
}
