"use client";

import { CSSProperties } from "react";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { useHover } from "@/hooks/useHover";
import { FilmCard, ContinueWatchingCard, RankedFilmCard, EditorsPickCard } from "@/components/film/FilmCard";
import { bg, film, rating, initials, FILMS } from "@/lib/data";

function HeroWatchLaterButton() {
  const { isInWatchLater, toggleWatchLater } = useApp();
  const inLater = isInWatchLater(1);
  return (
    <button onClick={() => toggleWatchLater(1)} aria-label="Watch Later" title="Watch Later" style={{ width: 52, height: 52, flex: "none", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: "50%", background: "none", color: "var(--text-primary)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {inLater ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wlPop 280ms var(--ease-standard)" }}><path d="M20 6 9 17l-5-5" /></svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      )}
    </button>
  );
}

function PlayPill({ onClick, hoverScale }: { onClick: () => void; hoverScale?: boolean }) {
  const { style, handlers } = useHover(
    { display: "inline-flex", alignItems: "center", gap: 9, minHeight: 54, padding: "0 32px", border: "none", borderRadius: 999, background: "#FFFFFF", color: "#1A1B1E", fontWeight: 800, fontSize: 15, cursor: "pointer", transition: "transform 180ms var(--ease-standard)" } as CSSProperties,
    hoverScale ? { transform: "scale(1.04)" } : {}
  );
  return (
    <button onClick={onClick} style={style} {...handlers}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>Play
    </button>
  );
}

function Rail({ title, sub, emoji, children }: { title: string; sub?: string; emoji?: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>{emoji ? emoji + " " : ""}{title}</h2>
        {sub && <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{sub}</span>}
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }} className="doris-scroll">{children}</div>
    </section>
  );
}

function RankCard({ filmId, rank }: { filmId: number; rank: number }) {
  const f = film(filmId);
  return (
    <div style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 118, lineHeight: 0.7, letterSpacing: "-0.06em", color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,.35)", marginRight: -8 }}>{rank}</span>
      <RankedFilmCard film={f} width={140} />
    </div>
  );
}

const CONVOS = [
  { film: "The Weight of Water", filmId: 1, at: 2530, quote: "That lagoon shot at golden hour is unreal — whole cinema went quiet.", author: "Chidi E.", count: 41 },
  { film: "Third Mainland", filmId: 2, at: 1490, quote: "The bridge sequence in real time had my heart in my throat.", author: "Tunde O.", count: 28 },
  { film: "The Weight of Water", filmId: 1, at: 4710, quote: "Does the confession betray Yemisi? Hot debate in here.", author: "Uche", count: 33 },
];

function ConvoCard({ c }: { c: typeof CONVOS[number] }) {
  const { openPlayer } = useFilmActions();
  const { style, handlers } = useHover({ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 18, cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", transition: "border-color 200ms var(--ease-standard),transform 200ms var(--ease-standard)" } as CSSProperties, { border: "1px solid var(--border-strong)", transform: "translateY(-3px)" });
  const m = Math.floor(c.at / 60), s = c.at % 60;
  const timeLabel = m + ":" + String(s).padStart(2, "0");
  return (
    <button onClick={() => openPlayer(c.filmId, c.at)} style={style} {...handlers}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#1A1B1E", background: "#fff", borderRadius: 5, padding: "2px 7px" }}>▸ {timeLabel}</span>{c.film}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: "var(--text-primary)" }}>&ldquo;{c.quote}&rdquo;</span>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{c.author} · <b style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{c.count} replies</b></span>
    </button>
  );
}

function CreatorSpotlightCard({ name, meta }: { name: string; meta: string }) {
  const { followedSet, toggleFollow } = useApp();
  const { openCreator } = useFilmActions();
  const following = !!followedSet[name];
  const { style, handlers } = useHover({ width: 230, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, transition: "border-color 200ms var(--ease-standard)" } as CSSProperties, { border: "1px solid var(--border-strong)" });
  return (
    <div style={style} {...handlers}>
      <button onClick={() => openCreator(name)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: "var(--font-ui)" }}>
        <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{initials(name)}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
      </button>
      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{meta}</span>
      <button onClick={() => toggleFollow(name)} style={{ minHeight: 36, padding: "0 18px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, background: following ? "rgba(255,255,255,.1)" : "var(--accent)", color: following ? "var(--text-primary)" : "var(--text-on-accent)" }}>{following ? "Following" : "Follow"}</button>
    </div>
  );
}

export default function HomePage() {
  const { openPlayer, openDetail } = useFilmActions();
  const editorial = film(1);

  const discussed = FILMS.slice().sort((a, b) => b.comments - a.comments).slice(0, 6);
  const award = [3, 1, 7, 5].map(film);
  const newOn = [8, 6, 2, 4, 7].map(film);
  const classics = [5, 3, 1, 6].map(film);
  const festivals = [7, 3, 5, 1].map(film);
  const creators = [
    { n: "Kemi Adetiba", m: "12.4k followers · 2 films" },
    { n: "C.J. Obasi", m: "8.1k followers · 2 films" },
    { n: "Amara Nwosu", m: "5.6k followers · 2 films" },
  ];

  return (
    <div style={{ width: "100%", animation: "dorisRise 300ms var(--ease-standard)" }}>
      {/* Full-bleed hero */}
      <section style={{ position: "relative", width: "100%", minHeight: "max(640px,90vh)", marginTop: -64, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `${bg(1, "20%")}`, animation: "dorisKen 26s ease-out infinite alternate", willChange: "transform" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(26,27,30,.96) 0%, rgba(26,27,30,.78) 30%, rgba(26,27,30,.25) 62%, rgba(26,27,30,0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1B1E 2%, rgba(26,27,30,.35) 26%, rgba(26,27,30,0) 55%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to bottom, rgba(26,27,30,.85) 0%, rgba(26,27,30,0) 100%)" }} />

        <div style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "96px 48px 128px", minHeight: "max(640px,90vh)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: 580, display: "flex", flexDirection: "column", gap: 18, animation: "dorisHeroIn 900ms var(--ease-standard) both" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1A1B1E", background: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: 10, whiteSpace: "nowrap" }}>🏆 AMAA Winner</span>Finale now streaming
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(48px,5.6vw,82px)", lineHeight: 0.96, letterSpacing: "-0.03em", textShadow: "0 2px 30px rgba(0,0,0,.45)" }}>{editorial.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 13.5, fontWeight: 600, color: "var(--text-secondary)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#fff" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg>{rating(editorial)}</span>
              <span style={{ opacity: .4 }}>·</span><span>{editorial.year}</span><span style={{ opacity: .4 }}>·</span><span>{editorial.runtime}</span><span style={{ opacity: .4 }}>·</span><span>{editorial.genre}</span><span style={{ opacity: .4 }}>·</span>
              <span style={{ border: "1px solid var(--border-strong)", borderRadius: 5, padding: "1px 7px", fontSize: 11 }}>PG-13</span>
            </div>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 520 }}>A fisherman&rsquo;s daughter returns to Makoko with a secret the lagoon won&rsquo;t keep — a haunting debut shot over two rainy seasons on the Lagos waterfront.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <PlayPill onClick={() => openPlayer(1)} hoverScale />
              <button onClick={() => openDetail(1)} style={{ minHeight: 54, padding: "0 28px", border: "1.5px solid rgba(255,255,255,.7)", borderRadius: 999, background: "rgba(255,255,255,.06)", color: "var(--text-primary)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Details</button>
              <HeroWatchLaterButton />
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)", marginTop: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
              <b style={{ color: "var(--text-primary)", fontWeight: 700 }}>214 people</b> discussing · 6 memorable moments
            </span>
          </div>
        </div>
      </section>

      {/* Shelves */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1360, margin: "-96px auto 0", padding: "0 48px 72px", display: "flex", flexDirection: "column", gap: 56 }}>

        <section>
          <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>Continue watching</h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }} className="doris-scroll">
            <ContinueWatchingCard filmId={1} progress={0.43} at={2530} />
            <ContinueWatchingCard filmId={4} progress={0.12} at={610} />
          </div>
        </section>

        <Rail title="Trending this week" sub="what Nigeria is watching now">
          {[1, 4, 2, 7, 5].map((id, i) => <RankCard key={id} filmId={id} rank={i + 1} />)}
        </Rail>

        <section style={{ display: "flex", gap: 32, alignItems: "center", background: "linear-gradient(120deg, var(--surface-1) 0%, rgba(33,35,39,0) 80%)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 24, overflow: "hidden" }}>
          <div style={{ position: "relative", flex: "none", width: 520, aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", background: bg(1, "30%"), boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,11,13,.4), rgba(10,11,13,0))" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Editor&rsquo;s Feature</span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{editorial.title}</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 480 }}>{editorial.synopsis}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
              <button onClick={() => openPlayer(1, 372)} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 46, padding: "0 24px", border: "none", borderRadius: 999, background: "#fff", color: "#1A1B1E", fontWeight: 800, fontSize: 14, cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>Play</button>
              <button onClick={() => openDetail(1)} style={{ minHeight: 46, padding: "0 22px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Full details</button>
            </div>
          </div>
        </section>

        <Rail title="Editor's picks" sub="hand-selected by the DORIS team">
          <EditorsPickCard film={film(3)} note={film(3).synopsis.slice(0, 88) + "…"} />
          <EditorsPickCard film={film(7)} note={film(7).synopsis.slice(0, 88) + "…"} />
          <EditorsPickCard film={film(1)} note={film(1).synopsis.slice(0, 88) + "…"} />
        </Rail>

        <Rail title="Most discussed" sub="where the conversation is happening" emoji="💬">
          {discussed.map((f) => <FilmCard key={f.id} film={f} />)}
        </Rail>

        <section style={{ background: "linear-gradient(120deg, var(--surface-1), rgba(33,35,39,0) 85%)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: "26px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>Trending conversations</h2>
            <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>jump straight into the moment</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {CONVOS.map((c, i) => <ConvoCard key={i} c={c} />)}
          </div>
        </section>

        <Rail title="Award winners" sub="AMAA & AFRIFF honourees" emoji="🏆">
          {award.map((f) => <FilmCard key={f.id} film={f} topLeftBadge={<span style={{ position: "absolute", top: 8, left: 8, fontSize: 14 }}>🏆</span>} />)}
        </Rail>

        <Rail title="New on DORIS">
          {newOn.map((f) => <FilmCard key={f.id} film={f} showTierBadge topRightBadge={<span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "#fff", color: "#1A1B1E", borderRadius: 4, padding: "3px 6px" }}>New</span>} />)}
        </Rail>

        <Rail title="Film festival selections" sub="TIFF · Berlinale · AFRIFF official picks">
          {festivals.map((f) => <FilmCard key={f.id} film={f} topLeftBadge={<span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: "rgba(10,11,13,.72)", color: "#fff", borderRadius: 4, padding: "3px 7px" }}>Official Selection</span>} />)}
        </Rail>

        <Rail title="Nigerian classics" sub="restored & remastered">
          {classics.map((f) => <FilmCard key={f.id} film={f} />)}
        </Rail>

        <section>
          <h2 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>Creator spotlight</h2>
          <div style={{ display: "flex", gap: 16 }}>
            {creators.map((c) => <CreatorSpotlightCard key={c.n} name={c.n} meta={c.m} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
