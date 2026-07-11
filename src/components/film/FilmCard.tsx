"use client";

import { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/lib/store";
import { useFilmActions } from "@/lib/actions";
import { useCardExpand } from "@/hooks/useCardExpand";
import { bg, film, rating, TAGLINES, type Film } from "@/lib/data";
import { tierBadge } from "@/lib/uiStyles";

/** Lucide `thumbs-up` — not a heart. Doris "Like" is an endorsement, not a favourite. */
const THUMBS_UP_PATH = "M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z";

function PlayIcon({ size = 13, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><polygon points="6 3 20 12 6 21 6 3" /></svg>;
}
function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wlPop 260ms var(--ease-standard)" }}><path d="M20 6 9 17l-5-5" /></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
function InfoIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
}

const iconBtn: CSSProperties = { width: 34, height: 34, flex: "none", borderRadius: "50%", border: "none", background: "rgba(255,255,255,.09)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };

interface Placement { left: number; top: number; width: number; originX: "left" | "right"; originY: "top" | "bottom"; }

const EXPAND_SCALE = 1.15;
const EST_PANEL_HEIGHT = 205;

/** Decides which edge the expanded card grows from so it never spills off-screen. */
function computePlacement(rect: DOMRect, baseWidth: number, heightRatio: number): Placement {
  const width = Math.round(baseWidth * EXPAND_SCALE);
  const posterHeight = width * heightRatio;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const overflowsRight = rect.left + width > vw - margin;
  const originX = overflowsRight ? "right" : "left";
  const left = overflowsRight ? Math.max(margin, rect.right - width) : rect.left;

  const fitsBelow = rect.top + posterHeight + EST_PANEL_HEIGHT < vh - margin;
  const originY = fitsBelow ? "top" : "bottom";
  const top = fitsBelow ? rect.top : Math.max(margin, rect.bottom - posterHeight - EST_PANEL_HEIGHT);

  return { left, top, width, originX, originY };
}

interface MediaCardProps {
  f: Film;
  width: number;
  cssAspect: string;
  heightRatio: number;
  poster: ReactNode;
  onPlay: () => void;
}

/**
 * The one hover interaction every movie card in Doris TV shares — Home, Browse,
 * My Stuff, Continue Watching, creator profiles. At rest it's a plain, grid-stable
 * poster + title. On hover/focus a portal-rendered card grows from the same spot:
 * poster keeps ~65-70% of the expanded footprint, a light panel below carries only
 * what's needed to decide — controls, rating/runtime/year, genre, one editorial line,
 * one community line. Portal-rendered (not positioned inline) so it escapes
 * horizontally-scrolling shelf rows instead of being clipped by them.
 */
function MediaCard({ f, width, cssAspect, heightRatio, poster, onPlay }: MediaCardProps) {
  const { isInWatchLater, toggleWatchLater, likedFilms, toggleLikeFilm } = useApp();
  const { openDetail } = useFilmActions();
  const { triggerRef, active, settled, rect, open, scheduleClose } = useCardExpand<HTMLDivElement>();

  const inLater = isInWatchLater(f.id);
  const liked = !!likedFilms[f.id];
  const placement = rect ? computePlacement(rect, width, heightRatio) : null;

  // Stays fully visible even while the portal is open — the expanded card is always
  // at least as big and paints above it (z-index), so it's covered, not hidden. If the
  // portal ever fails to mount, the plain card stays put instead of vanishing.
  const restingStyle: CSSProperties = { flex: "none", width, background: "none", border: "none", padding: 0, textAlign: "left", fontFamily: "var(--font-ui)", color: "var(--text-primary)", pointerEvents: active ? "none" : "auto" };

  return (
    <div
      ref={triggerRef}
      role="button"
      tabIndex={0}
      onClick={() => openDetail(f.id)}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onFocus={open}
      onBlur={scheduleClose}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(f.id); } }}
      style={restingStyle}
    >
      <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: cssAspect, borderRadius: "var(--radius-md)", overflow: "hidden", background: bg(f.id, "40%"), boxShadow: "var(--shadow-1)" }}>
        {poster}
      </span>
      <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginTop: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.title}</span>
      <span style={{ display: "block", fontSize: 12, color: "var(--text-tertiary)", marginTop: 3 }}>★ {rating(f)} · {f.runtime} · {f.genre}</span>

      {active && rect && placement && typeof document !== "undefined" && createPortal(
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
        />,
        document.body
      )}
    </div>
  );
}

function ExpandedCard({ f, rect, placement, heightRatio, settled, poster, onMouseEnter, onMouseLeave, onOpenDetail, onPlay, inLater, liked, onToggleLater, onToggleLike }: {
  f: Film; rect: DOMRect; placement: Placement; heightRatio: number; settled: boolean; poster: ReactNode;
  onMouseEnter: () => void; onMouseLeave: () => void; onOpenDetail: () => void; onPlay: () => void;
  inLater: boolean; liked: boolean; onToggleLater: () => void; onToggleLike: () => void;
}) {
  const restW = rect.width, restH = rect.height;
  const w = settled ? placement.width : restW;
  const posterH = settled ? w * heightRatio : restH;
  const left = settled ? placement.left : rect.left;
  const top = settled ? placement.top : rect.top;
  const tagline = TAGLINES[f.id];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed", left, top, width: w, zIndex: 45,
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        background: "var(--surface-2)",
        opacity: settled ? 1 : 0,
        boxShadow: settled ? "0 20px 46px rgba(0,0,0,.42), 0 0 0 1px rgba(255,255,255,.10)" : "var(--shadow-1)",
        transformOrigin: `${placement.originX} ${placement.originY}`,
        transition: "left 200ms var(--ease-standard), top 200ms var(--ease-standard), width 200ms var(--ease-standard), opacity 180ms var(--ease-standard), box-shadow 200ms var(--ease-standard)",
        fontFamily: "var(--font-ui)", color: "var(--text-primary)", cursor: "default",
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
        style={{ position: "relative", display: "block", width: "100%", height: posterH, border: "none", padding: 0, background: bg(f.id, "40%"), cursor: "pointer", overflow: "hidden", transition: "height 200ms var(--ease-standard)" }}
        aria-label={`${f.title} — view details`}
      >
        <span style={{ position: "absolute", inset: -4, transform: settled ? "scale(1.045)" : "scale(1)", transition: "transform 220ms var(--ease-standard)", background: bg(f.id, "40%") }} />
        {poster}
      </button>

      <div
        style={{
          padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 7,
          opacity: settled ? 1 : 0,
          transform: settled ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 180ms 30ms var(--ease-standard), transform 180ms 30ms var(--ease-standard)",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{f.title}</span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onPlay(); }} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 36, border: "none", borderRadius: 999, background: "#fff", color: "#1A1B1E", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            <PlayIcon />Play
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleLater(); }} aria-label="Watch Later" title="Watch Later" style={iconBtn}>{inLater ? <CheckIcon /> : <PlusIcon />}</button>
          <button onClick={(e) => { e.stopPropagation(); onToggleLike(); }} aria-label="Like" title="Like" style={{ ...iconBtn, background: liked ? "rgba(255,255,255,.22)" : iconBtn.background }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "#fff" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={THUMBS_UP_PATH} /></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onOpenDetail(); }} aria-label="View Details" title="View Details" style={iconBtn}><InfoIcon /></button>
        </div>

        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-secondary)" }}>
          <span style={{ color: "#fff", fontWeight: 700 }}>★ {rating(f)}</span> · {f.runtime} · {f.year}
        </span>
        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-tertiary)" }}>{f.genre}</span>

        {tagline && (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: "var(--text-secondary)", fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tagline}</p>
        )}

        <span style={{ display: "block", fontSize: 12, color: f.trending ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: f.trending ? 700 : 500 }}>
          {f.trending ? "🔥 Trending conversation" : `💬 ${f.comments} discussions`}
        </span>
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
}

/** The signature 2:3 poster card — Home shelves, Browse, My Stuff lists, creator profiles. */
export function FilmCard({ film: f, width = 210, topLeftBadge, topRightBadge, showTierBadge }: FilmCardProps) {
  const { rentOrPlay } = useFilmActions();
  const tb = tierBadge(f, true);
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "var(--gradient-card)" }} />
      {showTierBadge && <span style={tb.style}>{tb.label}</span>}
      {topLeftBadge}
      {topRightBadge}
    </>
  );
  return <MediaCard f={f} width={width} cssAspect="2 / 3" heightRatio={1.5} poster={poster} onPlay={() => rentOrPlay(f.id, 372)} />;
}

/** The 16:9 Continue Watching card — same hover interaction, still-frame artwork + resume progress. */
export function ContinueWatchingCard({ filmId, progress, at, width = 340 }: { filmId: number; progress: number; at: number; width?: number }) {
  const f = film(filmId);
  const { openPlayer } = useFilmActions();
  const leftLabel = Math.round((1 - progress) * 98) + " min left";
  const poster = (
    <>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,11,13,.75), rgba(10,11,13,0) 60%)" }} />
      <span style={{ position: "absolute", left: 14, bottom: 16, display: "inline-flex", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.95)", alignItems: "center", justifyContent: "center" }}><PlayIcon size={15} color="#1A1B1E" /></span>
      <span style={{ position: "absolute", right: 14, bottom: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.85)" }}>{leftLabel}</span>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "rgba(255,255,255,.2)" }}>
        <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: "var(--accent)", display: "block" }} />
      </span>
    </>
  );
  return <MediaCard f={f} width={width} cssAspect="16 / 9" heightRatio={9 / 16} poster={poster} onPlay={() => openPlayer(f.id, at)} />;
}
