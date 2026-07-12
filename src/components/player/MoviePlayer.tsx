"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { fmt, initials } from "@/lib/format";
import { useViewport } from "@/hooks/useViewport";
import { DURATION, EMOJIS, INITIAL_GENERAL, INITIAL_MOMENTS, Moment, MomentType, PlayerReply, sceneAt, typeMeta } from "./moviePlayerData";

type PanelView = "feed" | "moment";
type Tab = "all" | "general" | "moments" | "creator" | "featured";
type SortBy = "top" | "newest" | "oldest";
type MenuKind = "speed" | "captions" | "quality" | "settings" | null;

interface FeedEntry {
  id: number;
  name: string;
  ago: string;
  text: string;
  isCreator: boolean;
  likes: number;
  liked: boolean;
  hasTime: boolean;
  time: string;
  onJump: () => void;
  replies: PlayerReply[];
  attachment?: { name: string; url: string; type: string };
  // Present only for comments that live inside a moment's thread — lets edit/delete find
  // and mutate the right place (moments[i].thread) instead of the flat general[] list.
  momentId?: number;
}

function PlayIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>; }
function PauseIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>; }
function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
      {muted ? <path d="M23 9l-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />}
    </svg>
  );
}
// Standard "skip 10s" convention — a partial-circle arrow with the duration set inside it,
// matching the transport icons used by most premium players instead of a bare curved arrow.
function Replay10Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 9a8.5 8.5 0 1 1-1 6.5" />
      <path d="M1 5v4h4" />
      <text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none" fontFamily="var(--font-ui)">10</text>
    </svg>
  );
}
function Forward10Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 9a8.5 8.5 0 1 0 1 6.5" />
      <path d="M23 5v4h-4" />
      <text x="12" y="15.2" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none" fontFamily="var(--font-ui)">10</text>
    </svg>
  );
}
function CommentIcon({ active }: { active: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
// A literal "CC" badge (bordered rect, filled when captions are on) reads instantly at a
// glance the way a generic lined-rectangle glyph doesn't — matches the convention viewers
// already know from every other streaming player.
function CaptionsBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 17, borderRadius: 4, border: "1.6px solid currentColor", fontSize: 9.5, fontWeight: 800, letterSpacing: "0.01em", background: active ? "currentColor" : "none" }}>
      <span style={{ color: active ? "#141518" : "currentColor" }}>CC</span>
    </span>
  );
}
function ExpandIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3" /></svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" /></svg>
  );
}
function FileIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>; }

// A functional attachment chip — image types get a real thumbnail, everything else a file
// glyph — with either a remove control while composing or a real download link once posted,
// matching the "attached file" affordance from the Frame.io reference.
function AttachmentChip({ name, url, type, onRemove }: { name: string; url: string; type: string; onRemove?: () => void }) {
  const isImage = type.startsWith("image/");
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 7px 6px 6px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, maxWidth: 260 }}>
      <span style={{ width: 26, height: 26, flex: "none", borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,.1)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.7)" }}>
        {isImage ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileIcon />}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      {onRemove ? (
        <button onClick={onRemove} aria-label="Remove attachment" style={{ width: 22, height: 22, flex: "none", border: "none", background: "none", color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      ) : (
        <a href={url} download={name} aria-label="Download attachment" title="Download" style={{ width: 22, height: 22, flex: "none", border: "none", background: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
        </a>
      )}
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.63 22 9.24 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.24 8.91 8.63 12 2" />
    </svg>
  );
}
function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3" /></svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" /></svg>
  );
}

export interface PlayerFilm {
  id: number;
  title: string;
  creator: string;
  metaLine: string;
  posterUrl?: string;
  backdropUrl?: string;
  videoUrl?: string;
}

export function MoviePlayer({ startAt, onExit, onEnded, film }: { startAt?: number; onExit: () => void; onEnded?: () => void; film?: PlayerFilm }) {
  // A real uploaded master plays as itself — no fake runtime, no seeded demo discussion
  // that belongs to a different film. Only the original flagship demo title (catalog id 1)
  // keeps the full scripted discussion/scene data; every other film (catalog or upload)
  // starts from an honest empty state instead of showing "The Weight of Water"'s comments.
  const isUpload = !!film?.videoUrl;
  const demoContent = !film || film.id === 1;

  // No startAt means a fresh Play/Watch click (not a resume or jump-to-moment) — begin
  // at the beginning and start playing immediately, matching a real "Play" button.
  const [position, setPosition] = useState(startAt ?? 0);
  const [buffered, setBuffered] = useState(Math.max(900, (startAt ?? 0) + 900));
  const [playing, setPlaying] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("feed");
  const [activeId, setActiveId] = useState(3);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("top");
  const [filterMenu, setFilterMenu] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);
  const [draft, setDraft] = useState("");
  const [fileAttach, setFileAttach] = useState<{ name: string; url: string; type: string } | null>(null);
  const [composerEmojiOpen, setComposerEmojiOpen] = useState(false);
  const [likedSet, setLikedSet] = useState<Record<number, boolean>>({});
  const [attach, setAttach] = useState<{ start: number; end?: number } | null>(null);
  const [sceneMode, setSceneMode] = useState(false);
  const [showAttachTip, setShowAttachTip] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [repliesMap, setRepliesMap] = useState<Record<number, PlayerReply[]>>({});
  // A comment stays until its author deletes it — "own comment" is just name === "You"
  // (every comment posted through this session's composer), matching how the seeded
  // creator/community comments are never editable by the viewer either.
  const [actionsOpenId, setActionsOpenId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menu, setMenu] = useState<MenuKind>(null);
  // Tracks whether the current Quality/Speed/Subtitles submenu was reached via the Settings
  // list (so picking a value returns you to Settings) or opened directly off the CC shortcut
  // (so picking a value just closes, matching how a one-tap toggle should behave).
  const [subFromSettings, setSubFromSettings] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const [captions, setCaptions] = useState("Off");
  const [speed, setSpeed] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCur, setDragCur] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [general, setGeneral] = useState<PlayerReply[]>(demoContent ? INITIAL_GENERAL : []);
  const [moments, setMoments] = useState<Moment[]>(demoContent ? INITIAL_MOMENTS : []);

  const barRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  // Uploads use the real <video> duration once metadata loads; every other title (demo or
  // static catalog) keeps the fixed placeholder-clip duration it always used.
  const totalDuration = isUpload ? videoDuration || 1 : DURATION;
  const [videoError, setVideoError] = useState(false);
  // Starts unmuted like every real streaming player — a Watch click is a genuine user
  // gesture, so browsers allow autoplay-with-sound here. If one blocks it anyway, the
  // play-retry effect below catches that specific rejection and falls back to muted
  // playback rather than silently failing to play at all.
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeHover, setVolumeHover] = useState(false);
  const [hoverCtrl, setHoverCtrl] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [rated, setRated] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [fs, setFs] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const redirectedRef = useRef(false);
  const { isDesktop } = useViewport();

  // "The movie ended" is driven by the tracked position reaching the (real or fake) total
  // duration, not the underlying <video> tag's own end/loop — the demo clip is a short
  // placeholder that loops visually forever while `position` fake-counts up to a full
  // runtime, so its native `ended` event is meaningless there. Checked at every place
  // position can reach the end (the tick below, skip-forward, and scrub-seeking) rather
  // than via a separate effect watching position, which would just be derived state.
  const maybeEnd = (np: number) => { if (!ended && np >= totalDuration) { setEnded(true); setPlaying(false); } };

  useEffect(() => {
    tickTimer.current = setInterval(() => {
      setPosition((p) => {
        if (!playing) return p;
        const np = Math.min(totalDuration, p + 1);
        setBuffered((b) => Math.min(totalDuration, Math.max(b, np + 300)));
        maybeEnd(np);
        return np;
      });
    }, 1000);
    return () => { if (tickTimer.current) clearInterval(tickTimer.current); if (hideTimer.current) clearTimeout(hideTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, totalDuration]);

  // A real upload is a local blob URL — it's already fully "buffered" the moment its duration
  // is known, so its progress bar shows that directly instead of the demo clip's fake
  // buffered-ahead animation (derived at render time, not stored, to avoid a redundant state).
  const bufferedDisplay = isUpload ? videoDuration || 0 : buffered;

  // Once ended, redirect back to the title page — either the moment the viewer rates
  // (a beat to let the rating register) or automatically after a short pause if they don't
  // interact at all, same "we're done here" behavior as every major streaming player.
  useEffect(() => {
    if (!ended) return;
    const delay = rated > 0 ? 1400 : 8000;
    const t = setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      (onEnded || onExit)();
    }, delay);
    return () => clearTimeout(t);
  }, [ended, rated, onEnded, onExit]);

  const rateFilm = (n: number) => setRated(n);

  // Fullscreen reflects the browser's real fullscreenElement (not just local intent) so it
  // stays correct even when the viewer exits via Escape or a browser chrome control instead
  // of this button.
  useEffect(() => {
    const onChange = () => setFs(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  // Real playback, not a slow zoom on a still frame. Chrome's own intersection tracker for
  // muted, audioless video needs a paint cycle to confirm it's on-screen before it'll keep
  // playing — call play() too early and it silently re-pauses with "video-only background
  // media was paused to save power," and won't retry on its own, so: listen for any pause
  // while we're still meant to be playing and retry briefly.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!playing) { v.pause(); return; }
    let cancelled = false;
    let retriesLeft = 4;
    const tryPlay = () => {
      if (cancelled) return;
      v.play().catch((err: DOMException) => {
        if (cancelled) return;
        // The browser blocked unmuted autoplay (rare once a real user gesture — the Watch
        // click — started this session, but Safari in particular can still refuse it).
        // Fall back to muted playback instead of leaving the film paused on a black frame;
        // the volume control lets the viewer turn sound back on themselves.
        if (err.name === "NotAllowedError" && !v.muted) {
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
          return;
        }
        if (retriesLeft <= 0 || err.name !== "AbortError") return;
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
  }, [playing]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) { videoRef.current.muted = muted; videoRef.current.volume = volume; } }, [muted, volume]);

  const toggleMute = () => setMuted((m) => !m);
  const onVolumeChange = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
  };

  // The fictional demo film runs far longer than the placeholder clip, so a seek maps onto
  // the clip via modulo — gives a "the picture jumped" feel on scrub instead of a static
  // frame. A real upload has no such mismatch: position already is the real video's time.
  const seekVideo = (newPos: number) => {
    const v = videoRef.current;
    if (!v || !videoDuration) return;
    v.currentTime = isUpload ? Math.min(newPos, videoDuration) : newPos % videoDuration;
  };

  const scheduleHide = (willPlay: boolean) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (willPlay && !panelOpen && hoverId == null && !dragging && !menu && !sceneMode) {
      hideTimer.current = setTimeout(() => setChrome(false), 2800);
    }
  };
  const wake = () => { setChrome(true); scheduleHide(playing); };
  const togglePlay = () => { const next = !playing; setPlaying(next); setChrome(true); scheduleHide(next); };
  // Playback now starts automatically on mount (playing defaults to true, nothing else is
  // open yet), so the controls should fade the same way they would after a manual play —
  // otherwise they'd just sit on screen until the first mouse move.
  useEffect(() => {
    const t = setTimeout(() => setChrome(false), 2800);
    return () => clearTimeout(t);
  }, []);
  const back10 = () => setPosition((p) => { const np = Math.max(0, p - 10); seekVideo(np); return np; });
  const fwd10 = () => setPosition((p) => { const np = Math.min(totalDuration, p + 10); seekVideo(np); maybeEnd(np); return np; });

  const autosize = (el: HTMLTextAreaElement | null, max: number) => { if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, max) + "px"; };

  const ratioAt = (clientX: number) => {
    if (!barRef.current) return 0;
    const r = barRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  // dragCurRef mirrors dragCur but updates synchronously (not on the next render), so the
  // window-level mouseup handler below always reads the true final drag position even
  // though its own closure was captured back when the drag started.
  const dragCurRef = useRef(0);
  const onBarDown = (e: React.MouseEvent) => { const rt = ratioAt(e.clientX); dragCurRef.current = rt; setDragging(true); setDragStart(rt); setDragCur(rt); setDragMoved(false); };

  // A real mouse/trackpad drag very easily dips outside this strip's ~34px height for a
  // moment — it used to cancel the whole gesture via onMouseLeave, silently downgrading an
  // intended range-select into a single point. Tracking move/up on the window instead (from
  // the moment the drag starts until it ends) makes the drag survive leaving the strip,
  // matching how every native scrubber/range-picker actually behaves.
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const rt = ratioAt(e.clientX);
      dragCurRef.current = rt;
      setDragCur(rt);
      setDragMoved((m) => m || Math.abs(rt - dragStart) > 0.008);
    };
    const handleUp = () => {
      const cur = dragCurRef.current;
      const a = Math.min(dragStart, cur), b = Math.max(dragStart, cur);
      setDragging(false);
      setDragMoved((moved) => {
        if (sceneMode) {
          const start = Math.round(a * totalDuration);
          const end = moved ? Math.round(b * totalDuration) : undefined;
          setSceneMode(false);
          setAttach({ start, end }); setPosition(start); setPanelOpen(true); setPanelView("feed");
          setTimeout(() => composerRef.current?.focus(), 30);
        } else {
          const np = Math.round(cur * totalDuration);
          setPosition(np); seekVideo(np); maybeEnd(np);
        }
        return false;
      });
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, dragStart, sceneMode]);
  const stopEvt = (e: React.SyntheticEvent) => e.stopPropagation();

  const moment = (id: number) => moments.find((m) => m.id === id);
  const sorted = useMemo(() => moments.slice().sort((a, b) => a.at - b.at), [moments]);
  const totalComments = general.length + moments.reduce((a, m) => a + m.thread.length, 0);

  const openMoment = (id: number) => {
    const m = moment(id); if (!m) return;
    setActiveId(id); setPanelOpen(true); setPanelView("moment"); setPosition(m.at); seekVideo(m.at); setPlaying(false); setChrome(true); setHoverId(null); setDraft(""); setMenu(null); setSceneMode(false);
  };
  const toggleComments = () => { setPanelOpen((v) => !v); setPanelView("feed"); setMenu(null); setChrome(true); };
  const backToFeed = () => { setPanelView("feed"); setDraft(""); };
  const closePanel = () => { setPanelOpen(false); setSceneMode(false); };
  const prevMoment = () => { const so = sorted; const prev = so.slice().reverse().find((m) => m.at < position - 1); openMoment((prev || so[so.length - 1]).id); };
  const nextMoment = () => { const so = sorted; const next = so.find((m) => m.at > position + 1); openMoment((next || so[0]).id); };
  const toggleLike = (id: number) => setLikedSet((prev) => ({ ...prev, [id]: !prev[id] }));

  const openReply = (id: number) => { setReplyTo((cur) => (cur === id ? null : id)); setReplyDraft(""); setEmojiOpen(false); setTimeout(() => replyRef.current?.focus(), 30); };
  const cancelReply = () => { setReplyTo(null); setReplyDraft(""); setEmojiOpen(false); };
  const addEmoji = (ch: string) => { setReplyDraft((d) => d + ch); setTimeout(() => replyRef.current?.focus(), 10); };
  const sendReply = (id: number) => {
    const t = replyDraft.trim();
    if (!t) { setReplyTo(null); return; }
    setRepliesMap((prev) => ({ ...prev, [id]: [...(prev[id] || []), { id: Date.now(), name: "You", ago: "now", text: t }] }));
    setReplyTo(null); setReplyDraft(""); setEmojiOpen(false);
  };

  const startScene = () => { setSceneMode(true); setPanelOpen(true); setPlaying(false); setChrome(true); setShowAttachTip(false); };
  const cancelScene = () => setSceneMode(false);
  const removeAttach = () => setAttach(null);

  // Deletes from wherever the comment actually lives — a moment's thread (removing the whole
  // moment, and its timeline pin, once its last comment is gone) or the flat general list.
  const deleteComment = (entry: FeedEntry) => {
    if (entry.momentId != null) {
      setMoments((prev) => prev
        .map((m) => (m.id === entry.momentId ? { ...m, thread: m.thread.filter((c) => c.id !== entry.id) } : m))
        .filter((m) => m.thread.length > 0));
    } else {
      setGeneral((prev) => prev.filter((c) => c.id !== entry.id));
    }
    setActionsOpenId(null);
    if (editingId === entry.id) { setEditingId(null); setEditDraft(""); }
  };
  const startEdit = (entry: FeedEntry) => { setEditingId(entry.id); setEditDraft(entry.text); setActionsOpenId(null); };
  const cancelEdit = () => { setEditingId(null); setEditDraft(""); };
  const saveEdit = (entry: FeedEntry) => {
    const t = editDraft.trim();
    if (!t && !entry.attachment) return;
    if (entry.momentId != null) {
      setMoments((prev) => prev.map((m) => (m.id === entry.momentId ? { ...m, thread: m.thread.map((c) => (c.id === entry.id ? { ...c, text: t } : c)) } : m)));
    } else {
      setGeneral((prev) => prev.map((c) => (c.id === entry.id ? { ...c, text: t } : c)));
    }
    setEditingId(null); setEditDraft("");
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileAttach({ name: file.name, url: URL.createObjectURL(file), type: file.type });
    e.target.value = "";
  };
  const removeFileAttach = () => setFileAttach(null);
  const addComposerEmoji = (ch: string) => { setDraft((d) => d + ch); setTimeout(() => composerRef.current?.focus(), 10); };

  const postComment = () => {
    const t = draft.trim();
    if (!t && !fileAttach) return;
    const attachment = fileAttach || undefined;
    if (panelView === "moment") {
      setMoments((prev) => prev.map((m) => (m.id === activeId ? { ...m, thread: [...m.thread, { id: Date.now(), name: "You", ago: "now", text: t, likes: 0, attachment }] } : m)));
    } else if (attach) {
      const id = Date.now();
      const m: Moment = { id, at: attach.start, type: "community", thread: [{ id: id + 1, name: "You", ago: "now", text: t, likes: 0, attachment }] };
      if (attach.end != null && attach.end - attach.start > 8) m.end = attach.end;
      setMoments((prev) => [...prev, m]);
      setAttach(null); setPosition(attach.start); setTab("moments");
    } else {
      setGeneral((prev) => [{ id: Date.now(), name: "You", ago: "now", text: t, likes: 0, attachment }, ...prev]);
      setTab("general");
    }
    setDraft(""); setFileAttach(null); setComposerEmojiOpen(false);
    setTimeout(() => { if (composerRef.current) composerRef.current.style.height = "auto"; }, 0);
  };

  const feedComment = (c: PlayerReply, extra?: { at?: number; end?: number; momentId?: number }): FeedEntry => {
    const liked = !!likedSet[c.id];
    const replies = repliesMap[c.id] || [];
    return {
      id: c.id, name: c.name, ago: c.ago, text: c.text, isCreator: !!c.isCreator,
      likes: (c.likes || 0) + (liked ? 1 : 0), liked,
      // A scene comment linked to a range (e.g. 46:48–53:21) shows the full range, not just
      // its start — matching the range picked on the timeline, not a truncated single stamp.
      hasTime: extra?.at != null, time: extra?.at != null ? fmt(extra.at) + (extra.end != null ? "–" + fmt(extra.end) : "") : "",
      onJump: extra?.momentId != null ? () => openMoment(extra.momentId as number) : () => {},
      replies, attachment: c.attachment, momentId: extra?.momentId,
    };
  };

  // Scene beats/names are scripted demo content for the flagship title's narrative — a real
  // upload (or any other catalog title) just has no such data, so keep the marker safe
  // (center-cropped, unlabeled) instead of showing "Weight of Water" scene names on it.
  const scene = demoContent ? sceneAt(position) : { at: position, name: "", pos: "center" };
  const videoSrc = isUpload ? (film!.videoUrl as string) : "https://vjs.zencdn.net/v/oceans.mp4";
  const errorBg = film?.backdropUrl || film?.posterUrl || "/films/film-weight-of-water.png";
  const chromeOn = chrome || !playing || panelOpen || dragging || !!menu || sceneMode;

  const momentsFlat = useMemo(() => {
    const out: { c: PlayerReply; at: number; end?: number; momentId: number; kind: MomentType }[] = [];
    sorted.forEach((m) => m.thread.forEach((c) => out.push({ c, at: m.at, end: m.end, momentId: m.id, kind: m.type })));
    return out;
  }, [sorted]);

  const creatorCount = general.filter((c) => c.isCreator).length + momentsFlat.filter((x) => x.c.isCreator || x.kind === "creator").length;
  const featuredCount = momentsFlat.filter((x) => x.kind === "featured").length;
  const tabDefs: [Tab, string, number][] = [
    ["all", "All Comments", totalComments], ["general", "General", general.length], ["moments", "Moments", momentsFlat.length],
    ["creator", "Creator Notes", creatorCount], ["featured", "Featured", featuredCount],
  ];
  const filterLabel = (tabDefs.find(([k]) => k === tab) || tabDefs[0])[1];
  const sortDefs: [SortBy, string][] = [["top", "Top"], ["newest", "Newest"], ["oldest", "Oldest"]];
  const sortLabel = (sortDefs.find(([k]) => k === sortBy) || sortDefs[0])[1];

  let feed: FeedEntry[] = [];
  if (panelView === "moment") {
    const m = moment(activeId) || moments[2];
    feed = m.thread.map((c) => feedComment(c));
  } else if (tab === "general") feed = general.map((c) => feedComment(c));
  else if (tab === "moments") feed = momentsFlat.map((x) => feedComment(x.c, x));
  else if (tab === "creator") feed = general.filter((c) => c.isCreator).map((c) => feedComment(c)).concat(momentsFlat.filter((x) => x.c.isCreator || x.kind === "creator").map((x) => feedComment(x.c, x)));
  else if (tab === "featured") feed = momentsFlat.filter((x) => x.kind === "featured").map((x) => feedComment(x.c, x));
  else feed = general.map((c) => feedComment(c)).concat(momentsFlat.map((x) => feedComment(x.c, x)));

  if (panelView === "feed") {
    const q = search.trim().toLowerCase();
    if (q) feed = feed.filter((c) => (c.text + " " + c.name).toLowerCase().includes(q));
    if (sortBy === "top") feed = feed.slice().sort((a, b) => b.likes - a.likes);
    else if (sortBy === "oldest") feed = feed.slice().reverse();
  }

  const emptyMap: Record<string, [string, string]> = {
    general: ["No overall reviews yet", "Be the first to share what you thought of the film."],
    moments: ["No scene comments yet", "Use “Comment on a scene” to start one."],
    creator: ["No creator notes yet", "The filmmaker hasn't added notes here yet."],
    featured: ["No featured discussions", "Featured threads are curated by DORIS."],
    all: ["No comments yet", "Start the conversation below."],
  };
  const emptyKey = panelView === "moment" ? "all" : tab;
  const [emptyTitle, emptyBody] = emptyMap[emptyKey] || emptyMap.all;

  const markerVisible = (mt: MomentType) => {
    if (tab === "all" || tab === "moments") return true;
    if (tab === "creator") return mt === "creator";
    if (tab === "featured") return mt === "featured";
    if (tab === "general") return false;
    return true;
  };
  const markersOn = panelOpen;
  const pct = (t: number) => (t / totalDuration) * 100;

  const rangeBands = sorted.filter((m) => m.end && markerVisible(m.type));
  // Falls back to an empty placeholder moment when there's no seeded discussion data
  // (any upload, or any catalog title besides the flagship demo) — this is computed
  // unconditionally every render, so it must never be undefined even though the "moment"
  // panel view it feeds is only reachable when markers actually exist to open it.
  const activeMoment = moment(activeId) || moments[2] || { id: -1, at: 0, type: "community" as MomentType, thread: [] as PlayerReply[] };
  const active = { typeLabel: typeMeta(activeMoment.type).label, time: fmt(activeMoment.at) + (activeMoment.end ? "–" + fmt(activeMoment.end) : ""), title: activeMoment.title || sceneAt(activeMoment.at).name, countLabel: activeMoment.thread.length + (activeMoment.thread.length === 1 ? " comment" : " comments") };

  const hm = panelOpen && hoverId != null && !dragging && !sceneMode ? moment(hoverId) : null;
  let showDragBand = false, dragBandLeft = 0, dragBandWidth = 0;
  if (dragging && dragMoved && sceneMode) { const a = Math.min(dragStart, dragCur), b = Math.max(dragStart, dragCur); showDragBand = true; dragBandLeft = a * 100; dragBandWidth = (b - a) * 100; }

  // Bottom-bar control redesign: flat icons directly on the gradient, no button "chips" —
  // hover/active states read through icon opacity + a slight lift instead of a filled pill,
  // matching the minimal chrome of a premium native player rather than a UI-kit toolbar.
  const iconBtn = (key: string, active: boolean, size = 34): CSSProperties => ({
    width: size, height: size, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "none", background: "none", cursor: "pointer", padding: 0,
    color: active ? "#fff" : "rgba(255,255,255,.8)",
    opacity: hoverCtrl === key ? 1 : active ? 1 : 0.85,
    transform: hoverCtrl === key ? "scale(1.08)" : "scale(1)",
    transition: "opacity 150ms var(--ease-standard), transform 150ms var(--ease-standard), color 150ms var(--ease-standard)",
  });
  const ctrlHandlers = (key: string) => ({ onMouseEnter: () => setHoverCtrl(key), onMouseLeave: () => setHoverCtrl((h) => (h === key ? null : h)) });

  // Every submenu opened from Settings returns to the Settings root on selection (instead of
  // closing the whole menu) so switching between Quality/Speed/Subtitles is a real back-and-
  // forth flow, not a one-shot popup you have to reopen from the gear each time. Opened
  // directly off the CC shortcut, a selection just closes — there's no "settings" to return to.
  const inSettingsFlow = menu === "quality" || menu === "speed" || menu === "captions";
  const closeSubmenu = () => setMenu(subFromSettings ? "settings" : null);
  let menuTitle = "", menuItems: { label: string; sub?: string; selected: boolean; onClick: () => void }[] = [];
  if (menu === "quality") { menuTitle = "Quality"; menuItems = ["Auto", "1080p", "720p", "480p", "360p"].map((v) => ({ label: v, sub: v === "Auto" ? "Adjusts to your connection" : undefined, selected: quality === v, onClick: () => { setQuality(v); closeSubmenu(); } })); }
  else if (menu === "captions") { menuTitle = "Subtitles / CC"; menuItems = ["Off", "English", "Yoruba"].map((v) => ({ label: v, selected: captions === v, onClick: () => { setCaptions(v); closeSubmenu(); } })); }
  else if (menu === "speed") { menuTitle = "Playback speed"; menuItems = [[0.5, "0.5×"], [0.75, "0.75×"], [1, "Normal"], [1.25, "1.25×"], [1.5, "1.5×"], [2, "2×"]].map(([v, l]) => ({ label: l as string, selected: speed === v, onClick: () => { setSpeed(v as number); closeSubmenu(); } })); }
  else if (menu === "settings") { menuTitle = "Settings"; menuItems = [
    { label: "Quality", sub: quality, selected: false, onClick: () => { setSubFromSettings(true); setMenu("quality"); } },
    { label: "Playback speed", sub: speed === 1 ? "Normal" : speed + "×", selected: false, onClick: () => { setSubFromSettings(true); setMenu("speed"); } },
    { label: "Subtitles", sub: captions, selected: false, onClick: () => { setSubFromSettings(true); setMenu("captions"); } },
  ]; }

  const glass: CSSProperties = { background: "rgba(10,11,13,.96)", backdropFilter: "blur(34px) saturate(1.4)", border: "1px solid rgba(255,255,255,.16)", boxShadow: "0 30px 90px rgba(0,0,0,.7)" };
  // Below desktop there's no room for a floating side panel — it becomes a full-width bottom
  // sheet instead (like every mobile streaming app's comments drawer), with the expand
  // toggle just growing its height rather than trying to widen a panel that's already
  // edge-to-edge.
  const panelStyle: CSSProperties = !isDesktop
    ? { position: "absolute", left: 0, right: 0, bottom: 0, height: panelExpanded ? "88vh" : "64vh", display: "flex", flexDirection: "column", borderRadius: "20px 20px 0 0", overflow: "hidden", zIndex: 40, animation: "mpRise 300ms var(--ease-standard)", transition: "height 220ms var(--ease-standard)", ...glass }
    : panelExpanded
    ? { position: "absolute", right: 26, top: 88, bottom: 108, width: "min(560px, 46vw)", display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", zIndex: 40, animation: "mpRise 300ms var(--ease-standard)", transition: "width 220ms var(--ease-standard)", ...glass }
    : { position: "absolute", right: 26, bottom: 108, width: 384, maxHeight: "min(600px, calc(100vh - 180px))", display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", zIndex: 40, animation: "mpRise 300ms var(--ease-standard)", transition: "width 220ms var(--ease-standard)", ...glass };

  const composerPlaceholder = panelView === "moment" ? "Add to this moment…" : attach ? "Comment on this scene…" : "Share your thoughts on the film…";
  const attachLabel = attach ? fmt(attach.start) + (attach.end != null ? "–" + fmt(attach.end) : "") : "";

  return (
    <div ref={rootRef} onMouseMove={wake} style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000", fontFamily: "var(--font-ui)", color: "#fff" }}>
      {videoError ? (
        <div style={{ position: "absolute", inset: 0, background: `url("${errorBg}") ${scene.pos} / cover no-repeat`, transform: playing ? "scale(1.06)" : "scale(1.0)", transition: "transform 24s linear" }} />
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          muted={muted}
          loop={!isUpload}
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration || 0)}
          onEnded={() => { if (isUpload) { setEnded(true); setPlaying(false); } }}
          onError={() => setVideoError(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: playing ? "scale(1.06)" : "scale(1.0)", transition: "transform 24s linear" }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(130% 100% at 50% 35%, transparent 45%, rgba(0,0,0,.5) 100%)", pointerEvents: "none" }} />

      {/* Top chrome */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: 14, padding: "16px clamp(14px, 4vw, 26px) 40px", background: "linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%)", opacity: chromeOn ? 1 : 0, pointerEvents: chromeOn ? "auto" : "none", transition: "opacity 400ms var(--ease-standard)", zIndex: 20 }}>
        <button onClick={onExit} aria-label="Back" style={{ width: 40, height: 40, flex: "none", border: "none", borderRadius: 999, background: "rgba(10,10,12,.4)", backdropFilter: "blur(14px)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", textShadow: "0 1px 12px rgba(0,0,0,.5)" }}>{film?.title || "The Weight of Water"}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>{film ? `${film.creator} · ${film.metaLine}` : "Kemi Adetiba · 2024 · Free with ads"}</div>
        </div>
      </div>

      {/* Center play */}
      <button onClick={togglePlay} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 74, height: 74, borderRadius: "50%", border: "1px solid rgba(255,255,255,.14)", cursor: "pointer", background: "rgba(12,13,15,.38)", backdropFilter: "blur(16px)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,.45)", opacity: chromeOn && !sceneMode ? 1 : 0, pointerEvents: chromeOn && !sceneMode ? "auto" : "none", transition: "opacity 400ms var(--ease-standard)", zIndex: 15 }}>
        {playing ? <PauseIcon /> : <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4 }}><polygon points="6 3 20 12 6 21 6 3" /></svg>}
      </button>

      {sceneMode && (
        <div style={{ position: "absolute", left: "50%", top: "calc(50% + 30px)", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 11, padding: "12px 18px", border: "1px solid rgba(255,255,255,.2)", borderRadius: 14, background: "rgba(14,15,18,.82)", backdropFilter: "blur(18px)", color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 45, animation: "mpFade 220ms var(--ease-standard)", boxShadow: "0 16px 50px rgba(0,0,0,.5)" }}>
          <span style={{ width: 26, height: 26, flex: "none", borderRadius: 8, background: "rgba(255,255,255,.14)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="7" y1="8" x2="7" y2="16" /><line x1="17" y1="8" x2="17" y2="16" /></svg></span>
          <span>Click or drag across the timeline to pick the scene you&rsquo;d like to comment on.</span>
          <button onClick={cancelScene} style={{ border: "none", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Cancel</button>
        </div>
      )}

      {/* Bottom chrome */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 40, background: "linear-gradient(to top, rgba(0,0,0,.74) 0%, rgba(0,0,0,.25) 60%, rgba(0,0,0,0) 100%)", opacity: chromeOn ? 1 : 0, pointerEvents: chromeOn ? "auto" : "none", transition: "opacity 400ms var(--ease-standard)", zIndex: 20 }}>

        {hm && (
          (() => {
            const top = hm.thread[0];
            const pctPos = Math.min(86, Math.max(14, pct(hm.at)));
            return (
              // Compact annotation-style hover card — avatar, name, an amber timecode pill,
              // and the comment text, no thumbnail — matches the Frame.io reference instead
              // of the old movie-still preview card.
              <div style={{ position: "absolute", bottom: "100%", left: `calc(28px + (100% - 56px) * ${(pctPos / 100).toFixed(4)})`, transform: "translate(-50%, -14px)", width: 252, borderRadius: 14, padding: "12px 13px", background: "rgba(16,17,20,.97)", backdropFilter: "blur(20px) saturate(1.3)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 22px 60px rgba(0,0,0,.6)", animation: "mpFade 160ms var(--ease-standard)", pointerEvents: "none", zIndex: 30 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 24, height: 24, flex: "none", borderRadius: "50%", background: hm.type === "featured" ? "var(--warning)" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: hm.type === "featured" ? "#fff" : "#1A1B1E", boxShadow: top.isCreator ? "0 0 0 1.5px #1A1B1E" : "none" }}>{initials(top.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 5 }}>{top.name}{top.isCreator && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#1A1B1E", background: "#fff", borderRadius: 3, padding: "1px 4px" }}>Creator</span>}</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)" }}>{top.ago}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 8 }}>
                  <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--warning)", background: "var(--warning-subtle)", borderRadius: 5, padding: "2px 6px" }}>{fmt(hm.at)}{hm.end ? "–" + fmt(hm.end) : ""}</span>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{hm.title || top.text}</div>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)", marginTop: 8, fontWeight: 600 }}>{hm.thread.length} comment{hm.thread.length === 1 ? "" : "s"} · click to open</div>
              </div>
            );
          })()
        )}

        {/* Click-outside-to-close backdrop for the settings/captions popup. This must live
            inside "Bottom chrome" (not as its sibling) — that div's own opacity makes it a
            stacking context, so a z-index here is only ever compared against the popup's
            z-index (42) within it. Rendered as a sibling instead, its z-index compared against
            Bottom chrome's own (20) and — being higher — silently covered the popup entirely,
            swallowing every click on Quality/Speed/Subtitles before it reached a button. */}
        {menu && <div onClick={() => setMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 38 }} />}

        {menu && (
          <div style={{ position: "absolute", right: 28, bottom: 76, width: 236, padding: 8, borderRadius: 14, background: "rgba(16,17,20,.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 20px 60px rgba(0,0,0,.6)", zIndex: 42, animation: "mpMenu 160ms var(--ease-standard)" }}>
            {inSettingsFlow && subFromSettings ? (
              <button onClick={() => setMenu("settings")} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "4px 10px 8px", border: "none", background: "none", cursor: "pointer", color: "rgba(255,255,255,.5)", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>{menuTitle}
              </button>
            ) : (
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", padding: "4px 10px 8px" }}>{menuTitle}</div>
            )}
            {menuItems.map((mi, i) => (
              <button key={i} onClick={mi.onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", minHeight: 38, padding: "0 10px", border: "none", borderRadius: 9, cursor: "pointer", background: mi.selected ? "rgba(255,255,255,.1)" : "transparent", color: "#fff", fontFamily: "var(--font-ui)", textAlign: "left" }}>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{mi.label}</span>
                  {mi.sub && <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>{mi.sub}</span>}
                </span>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{mi.selected ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "0 clamp(12px, 4vw, 28px)" }}>
          <div ref={barRef} onMouseDown={onBarDown} style={{ position: "relative", cursor: sceneMode ? "crosshair" : "pointer" }}>
            <div style={{ position: "relative", height: 34, display: "flex", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", height: dragging || hoverId != null ? 6 : 4, borderRadius: 999, background: "rgba(255,255,255,.16)", transition: "height 150ms var(--ease-standard)" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(bufferedDisplay) + "%", background: "rgba(255,255,255,.22)", borderRadius: 999 }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(position) + "%", background: "#fff", borderRadius: 999 }} />

                {/* Scene-comment range selection — amber to match the timecode badges
                    elsewhere, and persists on the timeline (not just mid-drag) until posted
                    or cancelled, closer to Frame.io's held selection than a one-frame flash. */}
                {showDragBand && <div style={{ position: "absolute", left: dragBandLeft + "%", width: dragBandWidth + "%", top: "50%", transform: "translateY(-50%)", height: 10, borderRadius: 5, background: "var(--warning)", boxShadow: "0 0 0 1.5px rgba(255,255,255,.9)", zIndex: 5, pointerEvents: "none" }} />}
                {attach && !dragging && (
                  <div style={{ position: "absolute", left: pct(attach.start) + "%", width: Math.max(0.6, pct(attach.end ?? attach.start) - pct(attach.start)) + "%", top: "50%", transform: "translateY(-50%)", height: 10, borderRadius: 5, background: "var(--warning)", boxShadow: "0 0 0 1.5px rgba(255,255,255,.9)", zIndex: 5, pointerEvents: "none" }} />
                )}

                <span style={{ position: "absolute", left: pct(position) + "%", top: "50%", transform: "translate(-50%,-50%)", width: 13, height: 13, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.6)", pointerEvents: "none", zIndex: 7 }} />
              </div>
            </div>

            {/* Comment pins — avatar bubbles below the scrubber with a connector tick up to
                it (and a horizontal line for range comments), instead of abstract dots sitting
                on top of the track — shows who's talking, not just that something happened. */}
            {markersOn && sorted.filter((m) => markerVisible(m.type)).length > 0 && (
              <div style={{ position: "relative", height: 32 }}>
                {rangeBands.map((m) => (
                  <span key={"range-" + m.id} style={{ position: "absolute", left: pct(m.at) + "%", width: Math.max(0, pct(m.end || m.at) - pct(m.at)) + "%", top: 10, height: 2, borderRadius: 999, background: "rgba(255,255,255,.22)", pointerEvents: "none" }} />
                ))}
                {sorted.filter((m) => markerVisible(m.type)).map((m) => (
                  <span key={"tick-" + m.id} style={{ position: "absolute", left: pct(m.at) + "%", top: 0, width: 1, height: 8, background: "rgba(255,255,255,.28)", transform: "translateX(-50%)", pointerEvents: "none" }} />
                ))}
                {sorted.filter((m) => markerVisible(m.type)).map((m, i) => {
                  const selected = panelOpen && panelView === "moment" && activeId === m.id;
                  const hovered = hoverId === m.id;
                  const top = m.thread[0];
                  return (
                    <button
                      key={m.id} onClick={(e) => { e.stopPropagation(); openMoment(m.id); }} onMouseDown={stopEvt} onMouseEnter={() => setHoverId(m.id)} onMouseLeave={() => setHoverId(null)}
                      aria-label={typeMeta(m.type).label + " by " + top.name + " at " + fmt(m.at)}
                      style={{
                        position: "absolute", left: pct(m.at) + "%", top: 6, transform: `translateX(-50%) scale(${hovered || selected ? 1.15 : 1})`,
                        width: 21, height: 21, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
                        background: m.type === "featured" ? "var(--warning)" : "#fff", color: m.type === "featured" ? "#fff" : "#1A1B1E",
                        fontSize: 8.5, fontWeight: 800, fontFamily: "var(--font-ui)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                        boxShadow: selected ? "0 0 0 2px #1A1B1E, 0 0 10px rgba(255,255,255,.6)" : hovered ? "0 0 0 2px rgba(0,0,0,.35)" : "0 2px 6px rgba(0,0,0,.4)",
                        transition: "transform 150ms var(--ease-standard), box-shadow 150ms var(--ease-standard)",
                        animation: "mpMk 220ms var(--ease-standard) both", animationDelay: i * 28 + "ms",
                        zIndex: selected ? 6 : 4, pointerEvents: sceneMode ? "none" : "auto",
                      }}
                    >
                      {initials(top.name)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!playing && panelOpen && !sceneMode && (
            <div style={{ display: "flex", gap: 18, padding: "2px 2px 8px", fontSize: 10.5, color: "rgba(255,255,255,.55)", fontWeight: 600, animation: "mpFade 240ms var(--ease-standard)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />Comment</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--warning)" }} />Featured</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 2, borderRadius: 999, background: "rgba(255,255,255,.4)" }} />Scene range</span>
            </div>
          )}

          <div className="doris-scroll" style={{ display: "flex", alignItems: "center", gap: isDesktop ? 22 : 14, padding: "2px 0 18px", overflowX: isDesktop ? "visible" : "auto" }}>
            <button onClick={togglePlay} style={iconBtn("play", false, 36)} {...ctrlHandlers("play")} aria-label="Play/Pause">{playing ? <PauseIcon /> : <PlayIcon />}</button>

            <div style={{ display: "inline-flex", alignItems: "center", gap: isDesktop ? 16 : 10, flex: "none" }}>
              <button onClick={back10} style={iconBtn("back", false)} {...ctrlHandlers("back")} aria-label="Back 10 seconds"><Replay10Icon /></button>
              <button onClick={fwd10} style={iconBtn("fwd", false)} {...ctrlHandlers("fwd")} aria-label="Forward 10 seconds"><Forward10Icon /></button>
            </div>

            {isDesktop && (
              <div onMouseEnter={() => setVolumeHover(true)} onMouseLeave={() => setVolumeHover(false)} style={{ display: "inline-flex", alignItems: "center" }}>
                <button onClick={toggleMute} style={iconBtn("mute", false)} {...ctrlHandlers("mute")} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"}><VolumeIcon muted={muted} /></button>
                <input
                  type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volume"
                  style={{ width: volumeHover ? 72 : 0, opacity: volumeHover ? 1 : 0, marginLeft: volumeHover ? 6 : 0, accentColor: "#fff", cursor: "pointer", transition: "width 200ms var(--ease-standard), opacity 150ms var(--ease-standard), margin-left 200ms var(--ease-standard)" }}
                />
              </div>
            )}
            {!isDesktop && (
              <button onClick={toggleMute} style={{ ...iconBtn("mute", false), flex: "none" }} {...ctrlHandlers("mute")} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"}><VolumeIcon muted={muted} /></button>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 5, flex: "none" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#fff" }}>{fmt(position)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,.4)" }}>/ {fmt(totalDuration)}</span>
            </div>

            {isDesktop && scene.name && <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.45)" }}>{scene.name}</span>}

            {isDesktop && <span style={{ flex: 1 }} />}

            <button onClick={toggleComments} style={{ ...iconBtn("comments", panelOpen, 34), display: "inline-flex", alignItems: "center", gap: 7, width: "auto" }} {...ctrlHandlers("comments")} title="Comments" aria-label="Comments">
              <CommentIcon active={panelOpen} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700 }}>{totalComments}</span>
            </button>

            <button onClick={() => { setSubFromSettings(false); setMenu((m) => (m === "captions" ? null : "captions")); }} style={iconBtn("captions", menu === "captions" || captions !== "Off")} {...ctrlHandlers("captions")} aria-label="Captions" title="Subtitles / CC"><CaptionsBadge active={captions !== "Off"} /></button>

            <button onClick={() => setMenu((m) => (m === "settings" ? null : "settings"))} style={iconBtn("settings", menu === "settings" || (inSettingsFlow && subFromSettings))} {...ctrlHandlers("settings")} aria-label="Settings" title="Settings"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></button>

            <button onClick={toggleFullscreen} style={iconBtn("fullscreen", fs)} {...ctrlHandlers("fullscreen")} aria-label={fs ? "Exit fullscreen" : "Fullscreen"} title={fs ? "Exit fullscreen" : "Fullscreen"}><FullscreenIcon active={fs} /></button>
          </div>
        </div>
      </div>

      {/* Rate prompt — appears in the final 30s and stays through the end, matching every
          streaming app's "the credits are rolling, tell us what you thought" moment. */}
      {(ended || totalDuration - position <= 30) && !panelOpen && !sceneMode && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 118, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 25, opacity: chromeOn ? 1 : 0, pointerEvents: chromeOn ? "auto" : "none", transition: "opacity 400ms var(--ease-standard)", animation: "mpFade 300ms var(--ease-standard)" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>Rate</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>{film?.title || "The Weight of Water"}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => rateFilm(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`} style={{ border: "none", background: "none", cursor: "pointer", padding: 5, color: n <= (hoverRating || rated) ? "#fff" : "rgba(255,255,255,.35)", transition: "color 120ms var(--ease-standard), transform 120ms var(--ease-standard)", transform: n <= hoverRating ? "scale(1.12)" : "scale(1)" }}>
                <StarIcon filled={n <= (hoverRating || rated)} />
              </button>
            ))}
          </div>
          {rated > 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Thanks for rating — taking you back…</div>}
        </div>
      )}

      {/* Discussion panel */}
      {panelOpen && (
        <div style={panelStyle}>
          <div style={{ flex: "none", padding: "15px 18px 0", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {panelView === "moment" ? (
                <button onClick={backToFeed} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "none", color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "var(--font-ui)" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>All</button>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 800 }}>Discussion</span>
              )}
              <span style={{ flex: 1 }} />
              <button onClick={() => setPanelExpanded((v) => !v)} aria-label={panelExpanded ? "Collapse panel" : "Expand panel"} title={panelExpanded ? "Collapse" : "Expand"} style={{ width: 30, height: 30, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.72)", cursor: "pointer" }}><ExpandIcon expanded={panelExpanded} /></button>
              <button onClick={closePanel} aria-label="Close" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: 8, background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.72)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            {panelView === "moment" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 4px" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", borderRadius: 4, padding: "3px 8px", display: "inline-flex", background: typeMeta(activeMoment.type).bg, color: typeMeta(activeMoment.type).color, border: typeMeta(activeMoment.type).border }}>{active.typeLabel}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#fff" }}>{active.time}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>{active.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 12px" }}>
                  <button onClick={prevMoment} style={{ display: "inline-flex", alignItems: "center", gap: 5, minHeight: 28, padding: "0 11px", border: "1px solid rgba(255,255,255,.16)", borderRadius: 999, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>Prev</button>
                  <button onClick={nextMoment} style={{ display: "inline-flex", alignItems: "center", gap: 5, minHeight: 28, padding: "0 11px", border: "1px solid rgba(255,255,255,.16)", borderRadius: 999, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.85)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Next<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
                  <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{active.countLabel}</span>
                </div>
              </>
            ) : (
              <div style={{ margin: "12px 0 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button onClick={() => { setFilterMenu((v) => !v); setSortMenu(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px 0 4px", border: "none", borderRadius: 8, cursor: "pointer", background: filterMenu ? "rgba(255,255,255,.1)" : "none", color: "rgba(255,255,255,.85)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" /></svg>{filterLabel}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                  {filterMenu && (
                    <div style={{ position: "absolute", top: 38, left: 0, width: 210, padding: 6, borderRadius: 12, background: "rgba(18,19,22,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.6)", zIndex: 60, animation: "mpMenu 150ms var(--ease-standard)" }}>
                      {tabDefs.map(([key, label, count]) => (
                        <button key={key} onClick={() => { setTab(key); setFilterMenu(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: tab === key ? "rgba(255,255,255,.12)" : "transparent", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: tab === key ? 700 : 600, textAlign: "left" }}>
                          <span>{label}</span><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button onClick={() => { setSortMenu((v) => !v); setFilterMenu(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: sortMenu ? "rgba(255,255,255,.1)" : "none", color: "rgba(255,255,255,.85)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12M3 12h9M3 18h6" /></svg>{sortLabel}
                  </button>
                  {sortMenu && (
                    <div style={{ position: "absolute", top: 38, left: 0, width: 180, padding: 6, borderRadius: 12, background: "rgba(18,19,22,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.6)", zIndex: 60, animation: "mpMenu 150ms var(--ease-standard)" }}>
                      {sortDefs.map(([key, label]) => (
                        <button key={key} onClick={() => { setSortBy(key); setSortMenu(false); }} style={{ display: "block", width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: sortBy === key ? "rgba(255,255,255,.12)" : "transparent", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: sortBy === key ? 700 : 600, textAlign: "left" }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", borderRadius: 8, padding: "0 9px", height: 32, flex: 1, minWidth: 44 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" style={{ flex: "none" }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 12, color: "#fff", fontFamily: "var(--font-ui)" }} />
                </div>
              </div>
            )}
          </div>

          <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 18px 14px", minHeight: 0 }}>
            {feed.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 12px", color: "rgba(255,255,255,.6)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{emptyTitle}</div>
                <div style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.5 }}>{emptyBody}</div>
              </div>
            )}
            {feed.map((c) => {
              const isReplying = replyTo === c.id;
              const isMine = c.name === "You";
              const isEditing = editingId === c.id;
              return (
                // Flat, divider-separated rows — no per-comment card/border — reads like a
                // real conversation thread instead of a stack of boxed UI-kit cards.
                <div key={c.id} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.08)", animation: "mpFade 220ms var(--ease-standard)" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, boxShadow: c.isCreator ? "0 0 0 1.5px #fff" : "none" }}>{initials(c.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.name}</span>
                        {c.isCreator && <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1A1B1E", background: "#fff", borderRadius: 4, padding: "2px 6px" }}>Creator</span>}
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.42)" }}>{c.ago}</span>
                        {isMine && (
                          <div style={{ position: "relative", marginLeft: "auto" }}>
                            <button onClick={() => setActionsOpenId((v) => (v === c.id ? null : c.id))} aria-label="Comment actions" style={{ width: 24, height: 24, flex: "none", border: "none", background: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                            </button>
                            {actionsOpenId === c.id && (
                              <div style={{ position: "absolute", top: 26, right: 0, width: 128, padding: 5, borderRadius: 10, background: "rgba(20,21,24,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 14px 40px rgba(0,0,0,.55)", zIndex: 25, animation: "mpMenu 140ms var(--ease-standard)" }}>
                                <button onClick={() => startEdit(c)} style={{ display: "block", width: "100%", textAlign: "left", minHeight: 32, padding: "0 9px", border: "none", borderRadius: 7, background: "none", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => deleteComment(c)} style={{ display: "block", width: "100%", textAlign: "left", minHeight: 32, padding: "0 9px", border: "none", borderRadius: 7, background: "none", color: "var(--error)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                          <textarea value={editDraft} onChange={(e) => { autosize(e.target, 120); setEditDraft(e.target.value); }} rows={2} autoFocus style={{ width: "100%", resize: "none", minHeight: 50, maxHeight: 120, overflowY: "auto", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, color: "#fff", outline: "none", lineHeight: 1.45, fontFamily: "var(--font-ui)" }} />
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={cancelEdit} style={{ minHeight: 28, padding: "0 11px", background: "none", border: "none", borderRadius: 999, color: "rgba(255,255,255,.6)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Cancel</button>
                            <button onClick={() => saveEdit(c)} style={{ minHeight: 28, padding: "0 13px", background: "#fff", border: "none", borderRadius: 999, color: "#1A1B1E", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 4 }}>
                          {c.hasTime && <button onClick={c.onJump} style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, color: "var(--warning)", background: "var(--warning-subtle)", border: "none", borderRadius: 5, padding: "2px 7px", cursor: "pointer" }}>{c.time}</button>}
                          {c.text && <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.92)" }}>{c.text}</div>}
                        </div>
                      )}
                      {c.attachment && <div style={{ marginTop: 8 }}><AttachmentChip name={c.attachment.name} url={c.attachment.url} type={c.attachment.type} /></div>}
                      <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
                        <button onClick={() => toggleLike(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 600, color: c.liked ? "#fff" : "rgba(255,255,255,.5)", padding: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={c.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>{c.likes}</button>
                        <button onClick={() => openReply(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 600, color: isReplying ? "#fff" : "rgba(255,255,255,.5)", padding: 0 }}>Reply</button>
                      </div>
                      {c.replies.length > 0 && (
                        <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.1)", display: "flex", flexDirection: "column", gap: 9 }}>
                          {c.replies.map((r) => (
                            <div key={r.id} style={{ display: "flex", gap: 8 }}>
                              <span style={{ width: 22, height: 22, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 800, boxShadow: r.isCreator ? "0 0 0 1.5px #fff" : "none" }}>{initials(r.name)}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ fontSize: 11.5, fontWeight: 700 }}>{r.name}</span>{r.isCreator && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#1A1B1E", background: "#fff", borderRadius: 3, padding: "1px 4px" }}>Creator</span>}<span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{r.ago}</span></div>
                                <div style={{ fontSize: 12, lineHeight: 1.45, color: "rgba(255,255,255,.85)", marginTop: 2 }}>{r.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isReplying && (
                        <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.24)", display: "flex", flexDirection: "column", gap: 8, animation: "mpFade 200ms var(--ease-standard)" }}>
                          <textarea value={replyDraft} onChange={(e) => { autosize(e.target, 150); setReplyDraft(e.target.value); }} placeholder={`Reply to ${c.name}…`} rows={2} ref={replyRef} style={{ width: "100%", resize: "none", minHeight: 64, maxHeight: 150, overflowY: "auto", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#fff", outline: "none", lineHeight: 1.5, fontFamily: "var(--font-ui)" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" style={{ width: 30, height: 30, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, background: emojiOpen ? "rgba(255,255,255,.1)" : "none", color: "rgba(255,255,255,.7)", cursor: "pointer", transition: "background 150ms" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg></button>
                            <button aria-label="Attach file" style={{ width: 30, height: 30, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 8, background: "none", color: "rgba(255,255,255,.7)", cursor: "pointer" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg></button>
                            <span style={{ flex: 1 }} />
                            <button onClick={cancelReply} style={{ minHeight: 30, padding: "0 12px", background: "none", border: "none", borderRadius: 999, color: "rgba(255,255,255,.6)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Cancel</button>
                            <button onClick={() => sendReply(c.id)} aria-label="Send reply" style={{ width: 32, height: 32, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 999, cursor: replyDraft.trim() ? "pointer" : "not-allowed", background: replyDraft.trim() ? "#fff" : "rgba(255,255,255,.1)", color: replyDraft.trim() ? "#1A1B1E" : "rgba(255,255,255,.4)", transition: "all 150ms" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
                          </div>
                          {emojiOpen && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10 }}>
                              {EMOJIS.map((ch) => <button key={ch} onClick={() => addEmoji(ch)} style={{ width: 30, height: 30, border: "none", background: "none", borderRadius: 7, cursor: "pointer", fontSize: 16 }}>{ch}</button>)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ flex: "none", padding: "12px 18px 15px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
            {attach && panelView === "feed" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <button onClick={startScene} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "#1A1B1E", background: "#fff", border: "none", borderRadius: 999, padding: "5px 11px", cursor: "pointer" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{attachLabel}</button>
                <button onClick={removeAttach} style={{ border: "none", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", borderRadius: 999, width: 24, height: 24, cursor: "pointer", fontSize: 12 }} title="Remove scene link">✕</button>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>linked to this scene</span>
              </div>
            )}
            {panelView === "moment" && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 9, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.85)", background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "3px 9px" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>pins at {active.time}</div>
            )}
            {/* Unified bordered composer — text field and its action row share one surface
                (matching the reference), instead of a bare input with buttons floating beside it. */}
            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, background: "rgba(255,255,255,.045)", padding: "10px 10px 8px", display: "flex", flexDirection: "column", gap: fileAttach ? 9 : 2 }}>
              {fileAttach && <AttachmentChip name={fileAttach.name} url={fileAttach.url} type={fileAttach.type} onRemove={removeFileAttach} />}
              <textarea value={draft} onChange={(e) => { autosize(e.target, 120); setDraft(e.target.value); }} placeholder={composerPlaceholder} rows={1} ref={composerRef} style={{ width: "100%", resize: "none", minHeight: 22, maxHeight: 120, overflowY: "auto", background: "none", border: "none", padding: 0, fontSize: 13.5, color: "#fff", outline: "none", lineHeight: 1.45, fontFamily: "var(--font-ui)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf" onChange={onPickFile} style={{ display: "none" }} />
                <button onClick={() => fileInputRef.current?.click()} aria-label="Attach file" title="Attach file" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: 8, background: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <div style={{ position: "relative" }}>
                  <button onClick={() => setComposerEmojiOpen((v) => !v)} aria-label="Emoji" title="Emoji" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: 8, background: composerEmojiOpen ? "rgba(255,255,255,.1)" : "none", color: "rgba(255,255,255,.7)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                  </button>
                  {composerEmojiOpen && (
                    <div style={{ position: "absolute", bottom: 36, left: 0, width: 210, display: "flex", flexWrap: "wrap", gap: 4, padding: 8, borderRadius: 12, background: "rgba(18,19,22,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.6)", zIndex: 60, animation: "mpMenu 150ms var(--ease-standard)" }}>
                      {EMOJIS.map((ch) => <button key={ch} onClick={() => addComposerEmoji(ch)} style={{ width: 30, height: 30, border: "none", background: "none", borderRadius: 7, cursor: "pointer", fontSize: 16 }}>{ch}</button>)}
                    </div>
                  )}
                </div>
                {panelView === "feed" && (
                  <div style={{ position: "relative" }}>
                    <button onClick={startScene} onMouseEnter={() => setShowAttachTip(true)} onMouseLeave={() => setShowAttachTip(false)} aria-label="Comment on a scene" title="Comment on a scene" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: 8, background: sceneMode ? "#fff" : "none", color: sceneMode ? "#1A1B1E" : "rgba(255,255,255,.7)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="7" y1="8" x2="7" y2="16" /><line x1="13" y1="6" x2="13" y2="18" /><line x1="19" y1="9" x2="19" y2="15" /></svg>
                    </button>
                    {showAttachTip && (
                      <div style={{ position: "absolute", bottom: 36, left: 0, width: 210, padding: "10px 12px", borderRadius: 12, background: "rgba(20,21,24,.96)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 14px 40px rgba(0,0,0,.55)", zIndex: 50, animation: "mpFade 140ms var(--ease-standard)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Comment on a scene</div>
                        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.62)", lineHeight: 1.45, marginTop: 3 }}>Attach your comment to a specific moment in the film.</div>
                      </div>
                    )}
                  </div>
                )}
                <span style={{ flex: 1 }} />
                <button onClick={postComment} disabled={!draft.trim() && !fileAttach} aria-label="Post" style={{ width: 32, height: 32, flex: "none", border: "none", borderRadius: 999, cursor: draft.trim() || fileAttach ? "pointer" : "not-allowed", background: draft.trim() || fileAttach ? "#fff" : "rgba(255,255,255,.08)", color: draft.trim() || fileAttach ? "#1A1B1E" : "rgba(255,255,255,.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
