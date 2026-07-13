"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { useCardExpand } from "@/hooks/useCardExpand";
import { useViewport } from "@/hooks/useViewport";
import { filmBg, film, rating, type Film } from "@/lib/data";
import { tierBadge } from "@/lib/uiStyles";

/** Every movie card on Doris shares one footprint — Editor's Picks set the standard. */
export const CARD_WIDTH = 380;
// Fluid card width on tablet — shrinks so a shelf shows a peek of the next card (signalling
// it scrolls) instead of one nearly-full-viewport card. Caps at CARD_WIDTH so desktop is
// unchanged. On phones the card goes full-width instead (see MediaCard) — MUBI-style, one
// per row with real breathing room around the title, not a cramped multi-up grid.
export const CARD_WIDTH_CSS = `clamp(132px, 40vw, ${CARD_WIDTH}px)`;
export const CARD_ASPECT = "16 / 10";
export const CARD_HEIGHT_RATIO = 10 / 16;

/** Lucide `thumbs-up` — not a heart. Doris "Like" is an endorsement, not a favourite. */
const THUMBS_UP_PATH = "M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z";

function PlayIcon({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="6 3 20 12 6 21 6 3" /></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wlPop 260ms var(--ease-standard)" }}><path d="M20 6 9 17l-5-5" /></svg>;
}
function PlusIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}

const iconBtn: CSSProperties = { width: 36, height: 36, flex: "none", borderRadius: "50%", border: "1px solid rgba(255,255,255,.28)", background: "none", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };

/** Title baked directly into the artwork via a bottom scrim — MUBI-style, no separate caption below the card. */
function TitleOverlay({ title, sub }: { title: string; sub: string }) {
  return (
    <span style={{ position: "absolute", left: 14, right: 14, bottom: 12, zIndex: 2 }}>
      <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, lineHeight: 1.08, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#fff", textShadow: "0 1px 12px rgba(0,0,0,.6)" }}>{title}</span>
      <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(255,255,255,.72)", marginTop: 4 }}>{sub}</span>
    </span>
  );
}

interface Placement { left: number; top: number; width: number; }

const EXPAND_SCALE = 1.08;
const EST_PANEL_HEIGHT = 128;
// How far the card is allowed to grow upward past its resting top edge. Capped low
// on purpose: growing from dead centre (50/50) would reach ~70-90px above the
// resting card at this scale, which is enough to punch through a section heading
// sitting right above the row (typically ~20px away). This still reads as "grows
// from the middle" — noticeably more up-and-down than a pure top-anchor — without
// the collision.
const MAX_UPWARD_GROWTH = 28;

/**
 * Horizontally the card grows outward from its own centre — the MUBI feel, symmetric
 * left/right rather than anchoring a corner — clamped against the viewport edge only
 * when centring would overflow. Vertically it grows mostly downward with a small,
 * capped reach upward (see MAX_UPWARD_GROWTH) so it still feels centred without
 * reaching into whatever sits directly above the row.
 */
function computePlacement(rect: DOMRect, baseWidth: number, heightRatio: number): Placement {
  const width = Math.round(baseWidth * EXPAND_SCALE);
  const totalHeight = width * heightRatio + EST_PANEL_HEIGHT;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const restCenterX = rect.left + rect.width / 2;
  const left = Math.min(Math.max(restCenterX - width / 2, margin), Math.max(margin, vw - width - margin));

  const upGrowth = Math.min(Math.max(totalHeight - rect.height, 0) / 2, MAX_UPWARD_GROWTH);
  const idealTop = rect.top - upGrowth;
  const top = Math.min(Math.max(idealTop, margin), Math.max(margin, vh - totalHeight - margin));

  return { left, top, width };
}

interface MediaCardProps {
  f: Film;
  width: number;
  cssAspect: string;
  heightRatio: number;
  poster: ReactNode;
  onPlay: () => void;
  previewVideo?: boolean;
}

/**
 * The one hover interaction every movie card in Doris TV shares — Home, Browse,
 * My Stuff, Continue Watching, creator profiles. Sharp-edged, image-forward cards
 * (title baked into the artwork, no caption row) tiled tightly, MUBI-style. On
 * hover/focus a portal-rendered card grows modestly from the same spot into a
 * solid dark info panel — watch/save/like, synopsis, a compact metadata strip.
 * Portal-rendered (not positioned inline) so it escapes horizontally-scrolling
 * shelf rows instead of being clipped by them.
 */
function MediaCard({ f, width, cssAspect, heightRatio, poster, onPlay, previewVideo = true }: MediaCardProps) {
  const { isInWatchLater, toggleWatchLater, likedFilms, toggleLikeFilm } = useApp();
  const { openDetail } = useFilmActions();
  const { triggerRef, active, settled, rect, open, scheduleClose } = useCardExpand<HTMLDivElement>();
  const { isMobile, isDesktop } = useViewport();

  const inLater = isInWatchLater(f.id);
  const liked = !!likedFilms[f.id];
  // Placement math uses the card's real rendered width (rect.width), not the numeric width
  // prop — the card itself renders at a fluid, viewport-scaled CSS width (see restingStyle),
  // so the prop alone no longer reflects what's actually on screen.
  const placement = rect ? computePlacement(rect, rect.width, heightRatio) : null;

  // Stays fully visible AND interactive even while the portal is open. The portal is
  // always at least as big and paints above it via z-index, so the browser's normal
  // stacking-order hit-testing routes the mouse to the portal automatically. On phones the
  // card fills its row instead of using the tablet/desktop clamp — MUBI-style single-column
  // stack, one full-width poster + title per row instead of a cramped multi-up grid.
  const restingStyle: CSSProperties = { flex: isMobile ? "1 1 auto" : "none", width: isMobile ? "100%" : `clamp(132px, 40vw, ${width}px)`, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "var(--font-ui)", color: "var(--text-primary)" };

  // Hover-expand is a desktop affordance — touch has no real "hover", so a tap on mobile or
  // tablet would otherwise fire mouseenter (opening the expand portal) a beat before the
  // click navigates, showing a flash of the wrong UI. Skip wiring hover entirely below
  // desktop width so a tap goes straight to the detail page.
  const hoverHandlers = isDesktop ? { onMouseEnter: open, onMouseLeave: scheduleClose, onFocus: open, onBlur: scheduleClose } : {};

  return (
    <div
      ref={triggerRef}
      role="button"
      tabIndex={0}
      onClick={() => openDetail(f.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(f.id); } }}
      style={restingStyle}
      {...hoverHandlers}
    >
      <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: cssAspect, overflow: "hidden", background: filmBg(f, "40%") }}>
        {poster}
      </span>

      {isDesktop && active && rect && placement && typeof document !== "undefined" && createPortal(
        <ExpandedCard
          f={f}
          rect={rect}
          placement={placement}
          heightRatio={heightRatio}
          settled={settled}
          poster={poster}
          onMouseEnter={open}
          onMouseLeave={scheduleClose}
          onOpenDetail={() => openDetail(f.id)}
          onPlay={onPlay}
          inLater={inLater}
          liked={liked}
          onToggleLater={() => toggleWatchLater(f.id)}
          onToggleLike={() => toggleLikeFilm(f.id)}
          previewVideo={previewVideo}
        />,
        document.body
      )}
    </div>
  );
}

function ExpandedCard({ f, rect, placement, heightRatio, settled, poster, onMouseEnter, onMouseLeave, onOpenDetail, onPlay, inLater, liked, onToggleLater, onToggleLike, previewVideo }: {
  f: Film; rect: DOMRect; placement: Placement; heightRatio: number; settled: boolean; poster: ReactNode;
  onMouseEnter: () => void; onMouseLeave: () => void; onOpenDetail: () => void; onPlay: () => void;
  inLater: boolean; liked: boolean; onToggleLater: () => void; onToggleLike: () => void; previewVideo: boolean;
}) {
  const restW = rect.width, restH = rect.height;
  const w = settled ? placement.width : restW;
  const posterH = settled ? w * heightRatio : restH;
  const left = settled ? placement.left : rect.left;
  const top = settled ? placement.top : rect.top;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !previewVideo) return;
    if (!settled) { v.pause(); v.currentTime = 0; return; }

    let cancelled = false;
    let retriesLeft = 4;
    // Chrome's own intersection tracker for muted, audioless video needs a paint cycle to
    // confirm the element is on-screen before it'll actually keep playing — call play() too
    // early (right as the portal mounts) and it silently re-pauses with "video-only
    // background media was paused to save power," and won't retry on its own. So: listen
    // for any pause while we're still meant to be hovered and keep retrying briefly.
    const tryPlay = () => {
      if (cancelled) return;
      v.play().catch((err: DOMException) => {
        if (cancelled || retriesLeft <= 0 || err.name !== "AbortError") return;
        retriesLeft -= 1;
        setTimeout(tryPlay, 150);
      });
    };
    const onUnexpectedPause = () => {
      if (cancelled || retriesLeft <= 0) return;
      retriesLeft -= 1;
      setTimeout(tryPlay, 150);
    };
    v.addEventListener("pause", onUnexpectedPause);
    tryPlay();
    return () => { cancelled = true; v.removeEventListener("pause", onUnexpectedPause); };
  }, [settled, previewVideo]);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed", left, top, width: w, zIndex: 45,
        overflow: "hidden",
        background: "#0B0B0C",
        opacity: settled ? 1 : 0,
        boxShadow: settled ? "0 24px 56px rgba(0,0,0,.55)" : "var(--shadow-1)",
        transition: "left 200ms var(--ease-standard), top 200ms var(--ease-standard), width 200ms var(--ease-standard), opacity 180ms var(--ease-standard), box-shadow 200ms var(--ease-standard)",
        fontFamily: "var(--font-ui)", color: "var(--text-primary)", cursor: "default",
      }}
    >
      {/* A real <button> here would make any interactive badge in `poster` (e.g. a
          per-card download toggle) an invalid nested button, breaking hit-testing —
          role="button" on a div gets the same semantics/keyboard support without that. */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(); } }}
        style={{ position: "relative", display: "block", width: "100%", height: posterH, background: filmBg(f, "40%"), cursor: "pointer", overflow: "hidden", transition: "height 200ms var(--ease-standard)" }}
        aria-label={`${f.title} — view details`}
      >
        <span style={{ position: "absolute", inset: -4, transform: settled ? "scale(1.045)" : "scale(1)", transition: "transform 220ms var(--ease-standard)", background: filmBg(f, "40%") }} />
        {previewVideo && f.trailerUrl && !videoError && (
          <video
            ref={videoRef}
            src={f.trailerUrl}
            muted
            loop
            playsInline
            preload="none"
            onError={() => setVideoError(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: settled ? 1 : 0, transition: "opacity 260ms var(--ease-standard)", pointerEvents: "none" }}
          />
        )}
        {poster}
      </div>

      <div
        style={{
          padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6,
          opacity: settled ? 1 : 0,
          transform: settled ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 180ms 30ms var(--ease-standard), transform 180ms 30ms var(--ease-standard)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <button onClick={(e) => { e.stopPropagation(); onPlay(); }} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 32, border: "none", borderRadius: 999, background: "#fff", color: "#0B0B0C", fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer" }}>
            <PlayIcon size={12} />Watch
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleLater(); }} aria-label="Watch Later" title="Watch Later" style={{ ...iconBtn, width: 32, height: 32 }}>{inLater ? <CheckIcon /> : <PlusIcon />}</button>
          <button onClick={(e) => { e.stopPropagation(); onToggleLike(); }} aria-label="Like" title="Like" style={{ ...iconBtn, width: 32, height: 32, background: liked ? "#fff" : "none", color: liked ? "#0B0B0C" : "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={THUMBS_UP_PATH} /></svg>
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: "rgba(255,255,255,.72)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.synopsis}</p>

        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>★ {rating(f)} · {f.runtime} · {f.year} · {f.genre}</span>

        <span style={{ fontSize: 11.5, fontWeight: f.trending ? 700 : 500, color: f.trending ? "#fff" : "rgba(255,255,255,.55)" }}>{f.trending ? "🔥 Trending conversation" : `💬 ${f.comments} discussions`}</span>
      </div>
    </div>
  );
}

interface FilmCardProps {
  film: Film;
  width?: number;
  topLeftBadge?: ReactNode;
  topRightBadge?: ReactNode;
  showTierBadge?: boolean;
  previewVideo?: boolean;
}

/** The signature poster card — Home shelves, Browse, My Stuff lists, creator profiles. */
export function FilmCard({ film: f, width = CARD_WIDTH, topLeftBadge, topRightBadge, showTierBadge, previewVideo = true }: FilmCardProps) {
  const { rentOrPlay } = useFilmActions();
  const tb = tierBadge(f, true);
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.05) 55%, rgba(0,0,0,.15))" }} />
      <TitleOverlay title={f.title} sub={`${f.creator} · ${f.year}`} />
      {showTierBadge && <span style={tb.style}>{tb.label}</span>}
      {topLeftBadge}
      {topRightBadge}
    </>
  );
  return <MediaCard f={f} width={width} cssAspect={CARD_ASPECT} heightRatio={CARD_HEIGHT_RATIO} poster={poster} onPlay={() => rentOrPlay(f.id)} previewVideo={previewVideo} />;
}

/** Continue Watching card — same footprint as every other card, still-frame artwork + resume progress. */
export function ContinueWatchingCard({ filmId, progress, at, width = CARD_WIDTH }: { filmId: number; progress: number; at: number; width?: number }) {
  const f = film(filmId);
  const { openPlayer } = useFilmActions();
  const leftLabel = Math.round((1 - progress) * 98) + " min left";
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.05) 55%, rgba(0,0,0,.15))" }} />
      <TitleOverlay title={f.title} sub={leftLabel} />
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(255,255,255,.2)", zIndex: 2 }}>
        <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: "var(--accent)", display: "block" }} />
      </span>
    </>
  );
  return <MediaCard f={f} width={width} cssAspect={CARD_ASPECT} heightRatio={CARD_HEIGHT_RATIO} poster={poster} onPlay={() => openPlayer(f.id, at)} />;
}

/** Poster used inside the ranked "Trending this week" numeral row — same footprint as every other card. */
export function RankedFilmCard({ film: f, width = CARD_WIDTH }: { film: Film; width?: number }) {
  const { rentOrPlay } = useFilmActions();
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.05) 55%, rgba(0,0,0,.15))" }} />
      <TitleOverlay title={f.title} sub={`${f.creator} · ${f.year}`} />
    </>
  );
  return <MediaCard f={f} width={width} cssAspect={CARD_ASPECT} heightRatio={CARD_HEIGHT_RATIO} poster={poster} onPlay={() => rentOrPlay(f.id)} />;
}

/** Landscape editorial spotlight card — Home's "Editor's picks" rail. The reference size every other card matches. */
export function EditorsPickCard({ film: f, note, width = CARD_WIDTH }: { film: Film; note: string; width?: number }) {
  const { rentOrPlay } = useFilmActions();
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.08) 60%)" }} />
      <span style={{ position: "absolute", left: 16, right: 16, bottom: 14, zIndex: 2 }}>
        <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", textTransform: "uppercase", color: "#fff", textShadow: "0 1px 12px rgba(0,0,0,.6)" }}>{f.title}</span>
        <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,.72)", marginTop: 4, lineHeight: 1.5 }}>{note}</span>
      </span>
    </>
  );
  return <MediaCard f={f} width={width} cssAspect={CARD_ASPECT} heightRatio={CARD_HEIGHT_RATIO} poster={poster} onPlay={() => rentOrPlay(f.id)} />;
}
