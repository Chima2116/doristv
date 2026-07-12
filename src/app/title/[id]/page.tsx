"use client";

import { useParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { useNow } from "@/hooks/useNow";
import { useViewport } from "@/hooks/useViewport";
import { FilmCard } from "@/components/film/FilmCard";
import { ShelfRow } from "@/components/film/ShelfRow";
import { filmBg, rating, initials, naira, FILMS, TAGLINES, CREATOR_BIOS } from "@/lib/data";
import { publishedToFilm } from "@/lib/uploadTypes";
import { tierBadge } from "@/lib/uiStyles";

export default function FilmDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { router, rentOrPlay, openCreator, openPlayer } = useFilmActions();
  const { isInWatchLater, toggleWatchLater, likedFilms, toggleLikeFilm, followedSet, toggleFollow, rented, showToast, publishedFilms } = useApp();
  const now = useNow();
  const { isDesktop } = useViewport();

  // Catalog films are numbered 1-8; anything else is a creator upload (see uploadTypes.ts)
  // and gets adapted into the same Film shape so every viewer-facing surface (this page,
  // FilmCard, Home rails, Browse) doesn't need to know the difference.
  const staticFilm = FILMS.find((f) => f.id === id);
  const uploaded = publishedFilms.find((f) => f.id === id && f.status === "published");
  const df = staticFilm || (uploaded ? publishedToFilm(uploaded) : null);

  if (!df) {
    return (
      <div style={{ width: "100%", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Film not found</div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>It may have been unpublished, or the link is out of date.</p>
        <button onClick={() => router.push("/browse")} style={{ minHeight: 46, padding: "0 24px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Browse films</button>
      </div>
    );
  }

  const isRented = !!rented[df.id];
  const rentedAt = rented[df.id];
  let rentalLeft = "";
  if (isRented) {
    const remain = 48 * 3600 - Math.floor((now - rentedAt) / 1000);
    const h = Math.floor(remain / 3600), m = Math.floor((remain % 3600) / 60);
    rentalLeft = h + "h " + String(m).padStart(2, "0") + "m";
  }
  const detailCtaLabel = df.tier === "rent" && !isRented ? "Rent · " + naira(df.price || 0) + " · 48hr" : df.tier === "free" ? "Watch Free" : isRented ? "Watch now" : "Watch";
  const tb = tierBadge(df, false);
  const moreLike = FILMS.filter((f) => f.id !== df.id).slice(0, 6);
  const liked = !!likedFilms[df.id];
  const following = !!followedSet[df.creator];
  const inLater = isInWatchLater(df.id);

  const iconBtnStyle = { width: 48, height: 48, flex: "none" as const, borderRadius: "50%", border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.06)", color: "#fff", cursor: "pointer" as const, display: "inline-flex" as const, alignItems: "center" as const, justifyContent: "center" as const, backdropFilter: "blur(8px)" };

  const detailSpecs = [
    { k: "Runtime", v: df.runtime }, { k: "Genre", v: df.genre }, { k: "Release year", v: String(df.year) },
    { k: "Language", v: df.language }, { k: "Captions", v: "English" }, { k: "Country", v: "Nigeria" }, { k: "Production", v: "DORIS Originals" },
  ];

  return (
    <div style={{ width: "100%", animation: "dorisRise 300ms var(--ease-standard)" }}>
      <section style={{ position: "relative", width: "100%", minHeight: "100vh", marginTop: -64, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: filmBg(df, "20%", true), transform: "scale(1.02)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(26,27,30,.94) 0%, rgba(26,27,30,.6) 42%, rgba(26,27,30,.1) 72%, rgba(26,27,30,0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1B1E 1%, rgba(26,27,30,.35) 30%, rgba(26,27,30,0) 62%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 150, background: "linear-gradient(to bottom, rgba(26,27,30,.7), rgba(26,27,30,0))" }} />

        <button onClick={() => router.back()} style={{ position: "absolute", top: "clamp(64px, 9vw, 80px)", left: "clamp(16px, 4vw, 48px)", zIndex: 3, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(10,11,13,.4)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 999, padding: "9px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(10px)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>Back
        </button>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1360, margin: "0 auto", padding: "120px clamp(16px, 4vw, 48px) 88px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={tb.style}>{tb.label}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>★ {rating(df)}</span>
              {(df.id === 1 || df.id === 3) && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>🏆 AMAA Winner</span>}
            </div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(48px,6vw,86px)", lineHeight: 0.94, letterSpacing: "-0.03em", textShadow: "0 2px 40px rgba(0,0,0,.5)" }}>{df.title}</h1>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(16px,1.6vw,20px)", lineHeight: 1.35, color: "var(--text-secondary)", maxWidth: 520, fontStyle: "italic" }}>{TAGLINES[df.id] || ""}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 13.5, color: "var(--text-secondary)" }}>
              <span>{df.year}</span><span style={{ opacity: .4 }}>•</span><span>{df.runtime}</span><span style={{ opacity: .4 }}>•</span><span>{df.genre}</span><span style={{ opacity: .4 }}>•</span><span>Dir. {df.creator}</span><span style={{ opacity: .4 }}>•</span><span>{df.language}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <button onClick={() => rentOrPlay(df.id)} style={{ display: "inline-flex", alignItems: "center", gap: 9, minHeight: 52, padding: "0 30px", border: "none", borderRadius: 999, background: "#fff", color: "#1A1B1E", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>{detailCtaLabel}
              </button>
              <button onClick={() => showToast("Trailer coming soon")} style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 52, padding: "0 22px", border: "1px solid rgba(255,255,255,.4)", borderRadius: 999, background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", backdropFilter: "blur(8px)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" /></svg>Trailer
              </button>
              <button onClick={() => toggleWatchLater(df.id)} aria-label="Watch Later" title="Watch Later" style={{ ...iconBtnStyle, background: inLater ? "rgba(255,255,255,.16)" : iconBtnStyle.background }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <button onClick={() => toggleLikeFilm(df.id)} aria-label="Like" title="Like" style={{ ...iconBtnStyle, background: liked ? "rgba(255,255,255,.16)" : iconBtnStyle.background }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>
              </button>
              <button onClick={() => showToast("Share link copied")} aria-label="Share" title="Share" style={iconBtnStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
              </button>
              {df.tier !== "premium" && (
                <button onClick={() => showToast("Downloading for offline — 480p")} aria-label="Download" title="Download" style={iconBtnStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                </button>
              )}
            </div>
            {isRented && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--warning)", background: "var(--warning-subtle)", borderRadius: 999, padding: "7px 14px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{rentalLeft} left in your window
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>{df.comments} timestamped comments · a living conversation
            </span>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "8px clamp(16px, 4vw, 48px) 72px", display: "flex", flexDirection: isDesktop ? "row" : "column", gap: isDesktop ? 56 : 36, alignItems: isDesktop ? "flex-start" : "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 44 }}>
          <section>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Synopsis</span>
            <p style={{ margin: "14px 0 0", fontSize: 17, lineHeight: 1.75, color: "var(--text-primary)", maxWidth: 660 }}>{df.synopsis}</p>
          </section>

          <section style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "28px 0", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
            <button onClick={() => openCreator(df.creator)} style={{ flex: "none", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <span style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)" }}>{initials(df.creator)}</span>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Director · Filmmaker</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                <button onClick={() => openCreator(df.creator)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{df.creator}</button>
                <button onClick={() => toggleFollow(df.creator)} style={{ minHeight: 40, border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13.5, fontWeight: 700, background: following ? "rgba(255,255,255,.1)" : "var(--accent)", color: following ? "var(--text-primary)" : "var(--text-on-accent)", padding: "0 18px" }}>{following ? "Following" : "Follow"}</button>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.65, color: "var(--text-secondary)", maxWidth: 560 }}>{CREATOR_BIOS[df.creator] || "Independent filmmaker on DORIS."}</p>
              <button onClick={() => openCreator(df.creator)} style={{ marginTop: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>View full profile →</button>
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>The conversation</span>
              <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{df.comments} moments discussed</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 660 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--accent)" }}>KA</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>Kemi Adetiba</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "2px 6px" }}>Creator</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>▸ 42:10</span>
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>We waited three days on that shoreline for this exact light. Worth every mosquito bite.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "var(--surface-3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--text-secondary)" }}>CE</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>Chidi E.</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>▸ 42:10</span>
                  </div>
                  <p style={{ margin: "5px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>Golden hour on the water is unreal. This is my wallpaper now.</p>
                </div>
              </div>
            </div>
            <button onClick={() => openPlayer(df.id)} style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 20px", border: "1px solid var(--border-strong)", borderRadius: 999, background: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Join the conversation in the player →</button>
          </section>

          <section>
            <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>More like this</h2>
            <ShelfRow>
              {moreLike.map((f) => <FilmCard key={f.id} film={f} showTierBadge />)}
            </ShelfRow>
          </section>
        </div>

        <aside style={{ width: isDesktop ? 260 : "100%", flex: "none", display: "flex", flexDirection: "column", gap: 2, paddingTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Film details</span>
          {detailSpecs.map((sp) => (
            <div key={sp.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
              <span style={{ color: "var(--text-tertiary)" }}>{sp.k}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{sp.v}</span>
            </div>
          ))}
          {df.tier === "rent" && !isRented && (
            <div style={{ marginTop: 16, padding: 14, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-tertiary)" }}>To the filmmaker</span><span style={{ color: "var(--success)", fontWeight: 700 }}>70% of rental</span></div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
