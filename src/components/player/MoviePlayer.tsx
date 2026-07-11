"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { fmt, initials } from "@/lib/format";
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

export function MoviePlayer({ startAt, onExit }: { startAt?: number; onExit: () => void }) {
  // No startAt means a fresh Play/Watch click (not a resume or jump-to-moment) — begin
  // at the beginning and start playing immediately, matching a real "Play" button.
  const [position, setPosition] = useState(startAt ?? 0);
  const [buffered, setBuffered] = useState(Math.max(900, (startAt ?? 0) + 900));
  const [playing, setPlaying] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("feed");
  const [activeId, setActiveId] = useState(3);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("top");
  const [filterMenu, setFilterMenu] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);
  const [draft, setDraft] = useState("");
  const [likedSet, setLikedSet] = useState<Record<number, boolean>>({});
  const [attach, setAttach] = useState<{ start: number; end?: number } | null>(null);
  const [sceneMode, setSceneMode] = useState(false);
  const [showAttachTip, setShowAttachTip] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [repliesMap, setRepliesMap] = useState<Record<number, PlayerReply[]>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [menu, setMenu] = useState<MenuKind>(null);
  const [quality, setQuality] = useState("Auto");
  const [captions, setCaptions] = useState("Off");
  const [speed, setSpeed] = useState(1);
  const [fs, setFs] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCur, setDragCur] = useState(0);
  const [dragMoved, setDragMoved] = useState(false);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [general, setGeneral] = useState<PlayerReply[]>(INITIAL_GENERAL);
  const [moments, setMoments] = useState<Moment[]>(INITIAL_MOMENTS);

  const barRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  // Starts muted so autoplay isn't blocked by the browser — real, working volume control
  // (not just a mute toggle) lets viewers turn sound on themselves.
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    tickTimer.current = setInterval(() => {
      setPosition((p) => {
        if (!playing) return p;
        const np = Math.min(DURATION, p + 1);
        setBuffered((b) => Math.min(DURATION, Math.max(b, np + 300)));
        return np;
      });
    }, 1000);
    return () => { if (tickTimer.current) clearInterval(tickTimer.current); if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [playing]);

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
  }, [playing]);

  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);
  useEffect(() => { if (videoRef.current) { videoRef.current.muted = muted; videoRef.current.volume = volume; } }, [muted, volume]);

  const toggleMute = () => setMuted((m) => !m);
  const onVolumeChange = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
  };

  // The fictional film runs far longer than the placeholder clip, so a seek maps onto the
  // clip via modulo — gives a "the picture jumped" feel on scrub instead of a static frame.
  const seekVideo = (newPos: number) => {
    const v = videoRef.current;
    if (!v || !videoDuration) return;
    v.currentTime = newPos % videoDuration;
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
  const fwd10 = () => setPosition((p) => { const np = Math.min(DURATION, p + 10); seekVideo(np); return np; });

  const autosize = (el: HTMLTextAreaElement | null, max: number) => { if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, max) + "px"; };

  const ratioAt = (clientX: number) => {
    if (!barRef.current) return 0;
    const r = barRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const onBarDown = (e: React.MouseEvent) => { const rt = ratioAt(e.clientX); setDragging(true); setDragStart(rt); setDragCur(rt); setDragMoved(false); };
  const onBarMove = (e: React.MouseEvent) => { if (!dragging) return; const rt = ratioAt(e.clientX); setDragCur(rt); setDragMoved((m) => m || Math.abs(rt - dragStart) > 0.008); };
  const onBarUp = () => {
    if (!dragging) return;
    const a = Math.min(dragStart, dragCur), b = Math.max(dragStart, dragCur);
    if (sceneMode) {
      const start = Math.round(a * DURATION);
      const end = dragMoved ? Math.round(b * DURATION) : undefined;
      setDragging(false); setDragMoved(false); setSceneMode(false);
      setAttach({ start, end }); setPosition(start); setPanelOpen(true); setPanelView("feed");
      setTimeout(() => composerRef.current?.focus(), 30);
    } else {
      const np = Math.round(dragCur * DURATION);
      setDragging(false); setDragMoved(false); setPosition(np); seekVideo(np);
    }
  };
  const onBarLeave = () => { if (dragging) { setDragging(false); setDragMoved(false); } };
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

  const postComment = () => {
    const t = draft.trim();
    if (!t) return;
    if (panelView === "moment") {
      setMoments((prev) => prev.map((m) => (m.id === activeId ? { ...m, thread: [...m.thread, { id: Date.now(), name: "You", ago: "now", text: t, likes: 0 }] } : m)));
    } else if (attach) {
      const id = Date.now();
      const m: Moment = { id, at: attach.start, type: "community", thread: [{ id: id + 1, name: "You", ago: "now", text: t, likes: 0 }] };
      if (attach.end != null && attach.end - attach.start > 8) m.end = attach.end;
      setMoments((prev) => [...prev, m]);
      setAttach(null); setPosition(attach.start); setTab("moments");
    } else {
      setGeneral((prev) => [{ id: Date.now(), name: "You", ago: "now", text: t, likes: 0 }, ...prev]);
      setTab("general");
    }
    setDraft("");
    setTimeout(() => { if (composerRef.current) composerRef.current.style.height = "auto"; }, 0);
  };

  const feedComment = (c: PlayerReply, extra?: { at?: number; momentId?: number }): FeedEntry => {
    const liked = !!likedSet[c.id];
    const replies = repliesMap[c.id] || [];
    return {
      id: c.id, name: c.name, ago: c.ago, text: c.text, isCreator: !!c.isCreator,
      likes: (c.likes || 0) + (liked ? 1 : 0), liked,
      hasTime: extra?.at != null, time: extra?.at != null ? fmt(extra.at) : "",
      onJump: extra?.momentId != null ? () => openMoment(extra.momentId as number) : () => {},
      replies,
    };
  };

  const scene = sceneAt(position);
  const chromeOn = chrome || !playing || panelOpen || dragging || !!menu || sceneMode;

  const momentsFlat = useMemo(() => {
    const out: { c: PlayerReply; at: number; momentId: number; kind: MomentType }[] = [];
    sorted.forEach((m) => m.thread.forEach((c) => out.push({ c, at: m.at, momentId: m.id, kind: m.type })));
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
  const pct = (t: number) => (t / DURATION) * 100;

  const rangeBands = sorted.filter((m) => m.end && markerVisible(m.type));
  const activeMoment = moment(activeId) || moments[2];
  const active = { typeLabel: typeMeta(activeMoment.type).label, time: fmt(activeMoment.at) + (activeMoment.end ? "–" + fmt(activeMoment.end) : ""), title: activeMoment.title || sceneAt(activeMoment.at).name, countLabel: activeMoment.thread.length + (activeMoment.thread.length === 1 ? " comment" : " comments") };

  const hm = panelOpen && hoverId != null && !dragging && !sceneMode ? moment(hoverId) : null;
  let showDragBand = false, dragBandLeft = 0, dragBandWidth = 0;
  if (dragging && dragMoved && sceneMode) { const a = Math.min(dragStart, dragCur), b = Math.max(dragStart, dragCur); showDragBand = true; dragBandLeft = a * 100; dragBandWidth = (b - a) * 100; }

  const ctrlActive = (a: boolean): CSSProperties => ({ width: 38, height: 38, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 999, cursor: "pointer", background: a ? "rgba(255,255,255,.14)" : "transparent", color: a ? "#fff" : "rgba(255,255,255,.78)", transition: "all 150ms" });

  let menuTitle = "", menuItems: { label: string; sub?: string; selected: boolean; onClick: () => void }[] = [];
  if (menu === "quality") { menuTitle = "Quality"; menuItems = ["Auto", "1080p", "720p", "480p", "360p"].map((v) => ({ label: v, sub: v === "Auto" ? "Adjusts to your connection" : undefined, selected: quality === v, onClick: () => { setQuality(v); setMenu(null); } })); }
  else if (menu === "captions") { menuTitle = "Subtitles / CC"; menuItems = ["Off", "English", "Yoruba"].map((v) => ({ label: v, selected: captions === v, onClick: () => { setCaptions(v); setMenu(null); } })); }
  else if (menu === "speed") { menuTitle = "Playback speed"; menuItems = [[0.5, "0.5×"], [0.75, "0.75×"], [1, "Normal"], [1.25, "1.25×"], [1.5, "1.5×"], [2, "2×"]].map(([v, l]) => ({ label: l as string, selected: speed === v, onClick: () => { setSpeed(v as number); setMenu(null); } })); }
  else if (menu === "settings") { menuTitle = "Settings"; menuItems = [
    { label: "Quality", sub: quality, selected: false, onClick: () => setMenu("quality") },
    { label: "Playback speed", sub: speed === 1 ? "Normal" : speed + "×", selected: false, onClick: () => setMenu("speed") },
    { label: "Subtitles", sub: captions, selected: false, onClick: () => setMenu("captions") },
  ]; }

  const glass: CSSProperties = { background: "rgba(10,11,13,.96)", backdropFilter: "blur(34px) saturate(1.4)", border: "1px solid rgba(255,255,255,.16)", boxShadow: "0 30px 90px rgba(0,0,0,.7)" };
  const panelStyle: CSSProperties = { position: "absolute", right: 26, bottom: 108, width: 384, maxHeight: "min(600px, calc(100vh - 180px))", display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", zIndex: 40, animation: "mpRise 300ms var(--ease-standard)", ...glass };

  const composerPlaceholder = panelView === "moment" ? "Add to this moment…" : attach ? "Comment on this scene…" : "Share your thoughts on the film…";
  const attachLabel = attach ? fmt(attach.start) + (attach.end != null ? "–" + fmt(attach.end) : "") : "";

  return (
    <div onMouseMove={wake} style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000", fontFamily: "var(--font-ui)", color: "#fff" }}>
      {videoError ? (
        <div style={{ position: "absolute", inset: 0, background: `url("/films/film-weight-of-water.png") ${scene.pos} / cover no-repeat`, transform: playing ? "scale(1.06)" : "scale(1.0)", transition: "transform 24s linear" }} />
      ) : (
        <video
          ref={videoRef}
          src="https://vjs.zencdn.net/v/oceans.mp4"
          muted={muted}
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration || 0)}
          onError={() => setVideoError(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: playing ? "scale(1.06)" : "scale(1.0)", transition: "transform 24s linear" }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(130% 100% at 50% 35%, transparent 45%, rgba(0,0,0,.5) 100%)", pointerEvents: "none" }} />

      {/* Top chrome */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: 14, padding: "20px 26px 44px", background: "linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%)", opacity: chromeOn ? 1 : 0, pointerEvents: chromeOn ? "auto" : "none", transition: "opacity 400ms var(--ease-standard)", zIndex: 20 }}>
        <button onClick={onExit} aria-label="Back" style={{ width: 40, height: 40, flex: "none", border: "none", borderRadius: 999, background: "rgba(10,10,12,.4)", backdropFilter: "blur(14px)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", textShadow: "0 1px 12px rgba(0,0,0,.5)" }}>The Weight of Water</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)" }}>Kemi Adetiba · 2024 · Free with ads</div>
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
            const hsc = sceneAt(hm.at);
            const pctPos = Math.min(86, Math.max(14, pct(hm.at)));
            const tm = typeMeta(hm.type);
            return (
              <div style={{ position: "absolute", bottom: "100%", left: `calc(28px + (100% - 56px) * ${(pctPos / 100).toFixed(4)})`, transform: "translate(-50%, -12px)", width: 264, borderRadius: 16, overflow: "hidden", background: "rgba(14,15,18,.92)", backdropFilter: "blur(20px) saturate(1.3)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 22px 60px rgba(0,0,0,.6)", animation: "mpFade 160ms var(--ease-standard)", pointerEvents: "none", zIndex: 30 }}>
                <div style={{ position: "relative", height: 96, background: `url("/films/film-weight-of-water.png") ${hsc.pos} / cover no-repeat`, borderTopLeftRadius: 15, borderTopRightRadius: 15 }}>
                  <span style={{ position: "absolute", left: 9, bottom: 8, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "#fff", background: "rgba(0,0,0,.5)", borderRadius: 5, padding: "2px 7px", backdropFilter: "blur(4px)" }}>{fmt(hm.at)}{hm.end ? "–" + fmt(hm.end) : ""}</span>
                  <span style={{ position: "absolute", right: 8, bottom: 8, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 4, padding: "2px 6px", background: tm.bg, color: tm.color, border: tm.border }}>{tm.label}</span>
                </div>
                <div style={{ padding: "11px 13px 13px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{hm.title || hsc.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <span style={{ width: 24, height: 24, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 800, boxShadow: top.isCreator ? "0 0 0 1.5px #fff" : "none" }}>{initials(top.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>{top.name}{top.isCreator && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#1A1B1E", background: "#fff", borderRadius: 3, padding: "1px 4px" }}>Creator</span>}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.75)", lineHeight: 1.45, marginTop: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{top.text}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.5)", marginTop: 9, fontWeight: 600 }}>{hm.thread.length} comment{hm.thread.length === 1 ? "" : "s"} · click to open</div>
                </div>
              </div>
            );
          })()
        )}

        {menu && (
          <div style={{ position: "absolute", right: 28, bottom: 76, width: 236, padding: 8, borderRadius: 14, background: "rgba(16,17,20,.96)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 20px 60px rgba(0,0,0,.6)", zIndex: 42, animation: "mpMenu 160ms var(--ease-standard)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", padding: "4px 10px 8px" }}>{menuTitle}</div>
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

        <div style={{ padding: "0 28px" }}>
          <div ref={barRef} onMouseDown={onBarDown} onMouseMove={onBarMove} onMouseUp={onBarUp} onMouseLeave={onBarLeave} style={{ position: "relative", height: 34, display: "flex", alignItems: "center", cursor: sceneMode ? "crosshair" : "pointer" }}>
            <div style={{ position: "relative", width: "100%", height: dragging || hoverId != null ? 6 : 4, borderRadius: 999, background: "rgba(255,255,255,.16)", transition: "height 150ms var(--ease-standard)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(buffered) + "%", background: "rgba(255,255,255,.22)", borderRadius: 999 }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(position) + "%", background: "#fff", borderRadius: 999 }} />

              {markersOn && rangeBands.map((m) => {
                const sel = panelOpen && panelView === "moment" && activeId === m.id;
                return (
                  <button key={m.id} onClick={(e) => { e.stopPropagation(); openMoment(m.id); }} onMouseDown={stopEvt} onMouseEnter={() => setHoverId(m.id)} onMouseLeave={() => setHoverId(null)} aria-label={`Discussion range ${fmt(m.at)} to ${fmt(m.end || 0)}`}
                    style={{ position: "absolute", left: pct(m.at) + "%", width: pct(m.end || m.at) - pct(m.at) + "%", top: "50%", transform: "translateY(-50%)", height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: sel ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.28)", boxShadow: sel ? "0 0 0 1.5px rgba(255,255,255,.8), 0 0 12px rgba(255,255,255,.5)" : "none", animation: "mpFade 240ms var(--ease-standard) both", transition: "background 150ms var(--ease-standard), box-shadow 150ms var(--ease-standard)", zIndex: 3, pointerEvents: sceneMode ? "none" : "auto" }} />
                );
              })}

              {showDragBand && <div style={{ position: "absolute", left: dragBandLeft + "%", width: dragBandWidth + "%", top: "50%", transform: "translateY(-50%)", height: 10, borderRadius: 5, background: "rgba(255,255,255,.45)", boxShadow: "0 0 0 1.5px rgba(255,255,255,.9)", zIndex: 5, pointerEvents: "none" }} />}

              {markersOn && sorted.filter((m) => markerVisible(m.type)).map((m, i) => {
                const selected = panelOpen && panelView === "moment" && activeId === m.id;
                const hovered = hoverId === m.id;
                const scale = hovered || selected ? (selected ? " scale(1.55)" : " scale(1.5)") : "";
                const ring = selected ? ", 0 0 0 3px rgba(255,255,255,.9), 0 0 14px rgba(255,255,255,.7)" : "";
                const anim = (m.type === "creator" ? "mpMkRot" : "mpMk") + " 220ms var(--ease-standard) both";
                const delay = i * 28 + "ms";
                const base: CSSProperties = { position: "absolute", left: pct(m.at) + "%", top: "50%", padding: 0, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "transform 160ms var(--ease-standard), box-shadow 160ms var(--ease-standard)", background: "transparent", zIndex: selected ? 6 : 4, pointerEvents: sceneMode ? "none" : "auto", animation: anim, animationDelay: delay };
                let markerStyle: CSSProperties;
                if (m.type === "creator") markerStyle = { ...base, width: 11, height: 11, borderRadius: 2.5, border: "1.8px solid #fff", background: "rgba(26,27,30,.9)", transform: "translate(-50%,-50%) rotate(45deg)" + scale, boxShadow: selected ? "0 0 0 3px rgba(255,255,255,.9)" : "none" };
                else if (m.type === "discussed") markerStyle = { ...base, width: 13, height: 13, borderRadius: "50%", background: "#fff", transform: "translate(-50%,-50%)" + scale, boxShadow: "0 0 12px rgba(255,255,255,.85)" + ring };
                else if (m.type === "featured") markerStyle = { ...base, width: 16, height: 16, borderRadius: "50%", background: "#fff", transform: "translate(-50%,-50%)" + scale, boxShadow: "0 1px 6px rgba(0,0,0,.4)" + ring };
                else markerStyle = { ...base, width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,.65)", transform: "translate(-50%,-50%)" + scale, boxShadow: "0 0 0 3px rgba(0,0,0,.35)" + ring };
                return (
                  <button key={m.id} onClick={(e) => { e.stopPropagation(); openMoment(m.id); }} onMouseDown={stopEvt} onMouseEnter={() => setHoverId(m.id)} onMouseLeave={() => setHoverId(null)} aria-label={typeMeta(m.type).label + " at " + fmt(m.at)} style={markerStyle}>
                    {m.type === "featured" && <svg width="9" height="9" viewBox="0 0 24 24" fill="#1A1B1E"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg>}
                  </button>
                );
              })}

              <span style={{ position: "absolute", left: pct(position) + "%", top: "50%", transform: "translate(-50%,-50%)", width: 13, height: 13, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.6)", pointerEvents: "none", zIndex: 7 }} />
            </div>
          </div>

          {!playing && panelOpen && !sceneMode && (
            <div style={{ display: "flex", gap: 18, padding: "2px 2px 8px", fontSize: 10.5, color: "rgba(255,255,255,.55)", fontWeight: 600, animation: "mpFade 240ms var(--ease-standard)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,.6)" }} />Community</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, transform: "rotate(45deg)", border: "1.6px solid #fff" }} />Creator note</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", boxShadow: "0 0 10px rgba(255,255,255,.8)" }} />Most discussed</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><svg width="7" height="7" viewBox="0 0 24 24" fill="#1A1B1E"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg></span>Featured</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingBottom: 16 }}>
            <button onClick={togglePlay} style={ctrlActive(false)} aria-label="Play/Pause">{playing ? <PauseIcon /> : <PlayIcon />}</button>
            <button onClick={back10} style={ctrlActive(false)} aria-label="Back 10 seconds"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 8 6 12l5 4" /><path d="M6 12h9a5 5 0 0 1 0 10h-2" /></svg></button>
            <button onClick={fwd10} style={ctrlActive(false)} aria-label="Forward 10 seconds"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 8 5 4-5 4" /><path d="M18 12H9a5 5 0 0 0 0 10h2" /></svg></button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
              <button onClick={toggleMute} style={ctrlActive(false)} aria-label={muted ? "Unmute" : "Mute"} title={muted ? "Unmute" : "Mute"}><VolumeIcon muted={muted} /></button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                aria-label="Volume"
                style={{ width: 64, accentColor: "#fff", cursor: "pointer" }}
              />
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "rgba(255,255,255,.75)", marginLeft: 8 }}>{fmt(position)} <span style={{ opacity: .45 }}>/ 1:38:00</span></span>
            <span style={{ marginLeft: 14, fontSize: 12, color: "rgba(255,255,255,.45)" }}>{scene.name}</span>
            <span style={{ flex: 1 }} />

            <button onClick={toggleComments} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", border: "none", borderRadius: 999, cursor: "pointer", background: panelOpen ? "#fff" : "rgba(255,255,255,.1)", color: panelOpen ? "#1A1B1E" : "#fff", transition: "all 150ms", fontFamily: "var(--font-ui)" }} title="Comments" aria-label="Comments">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{totalComments}</span>
            </button>
            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,.14)", margin: "0 8px" }} />
            <button onClick={() => setMenu((m) => (m === "speed" ? null : "speed"))} style={ctrlActive(menu === "speed")} title="Playback speed"><span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 600 }}>{speed === 1 ? "1×" : speed + "×"}</span></button>
            <button onClick={() => setMenu((m) => (m === "captions" ? null : "captions"))} style={ctrlActive(menu === "captions" || captions !== "Off")} aria-label="Captions"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M7 12h2m3 0h5" /><path d="M7 15h5m3 0h2" /></svg></button>
            <button onClick={() => setMenu((m) => (m === "quality" ? null : "quality"))} style={ctrlActive(menu === "quality")} title="Quality"><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>{quality === "Auto" ? "Auto" : quality}</span></button>
            <button onClick={() => setMenu((m) => (m === "settings" ? null : "settings"))} style={ctrlActive(menu === "settings")} aria-label="Settings"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg></button>
            <button onClick={() => setFs((v) => !v)} style={ctrlActive(false)} aria-label="Fullscreen">
              {!fs ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3" /></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3" /></svg>}
            </button>
          </div>
        </div>
      </div>

      {menu && <div onClick={() => setMenu(null)} style={{ position: "absolute", inset: 0, zIndex: 38 }} />}

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
              <div style={{ margin: "12px 0 12px", display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "0 11px", height: 38 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments" style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 12.5, color: "#fff", fontFamily: "var(--font-ui)" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <button onClick={() => { setFilterMenu((v) => !v); setSortMenu(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", height: 36, padding: "0 12px", border: "1px solid rgba(255,255,255,.14)", borderRadius: 9, cursor: "pointer", background: filterMenu ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" /></svg>{filterLabel}</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                    </button>
                    {filterMenu && (
                      <div style={{ position: "absolute", top: 44, left: 0, width: 210, padding: 6, borderRadius: 12, background: "rgba(18,19,22,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.6)", zIndex: 60, animation: "mpMenu 150ms var(--ease-standard)" }}>
                        {tabDefs.map(([key, label, count]) => (
                          <button key={key} onClick={() => { setTab(key); setFilterMenu(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: tab === key ? "rgba(255,255,255,.12)" : "transparent", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: tab === key ? 700 : 600, textAlign: "left" }}>
                            <span>{label}</span><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,.5)" }}>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => { setSortMenu((v) => !v); setFilterMenu(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 13px", border: "1px solid rgba(255,255,255,.14)", borderRadius: 9, cursor: "pointer", background: sortMenu ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12M3 12h9M3 18h6" /></svg>{sortLabel}
                    </button>
                    {sortMenu && (
                      <div style={{ position: "absolute", top: 44, right: 0, width: 180, padding: 6, borderRadius: 12, background: "rgba(18,19,22,.98)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 18px 50px rgba(0,0,0,.6)", zIndex: 60, animation: "mpMenu 150ms var(--ease-standard)" }}>
                        {sortDefs.map(([key, label]) => (
                          <button key={key} onClick={() => { setSortBy(key); setSortMenu(false); }} style={{ display: "block", width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: sortBy === key ? "rgba(255,255,255,.12)" : "transparent", color: "#fff", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: sortBy === key ? 700 : 600, textAlign: "left" }}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 11, minHeight: 0 }}>
            {feed.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 12px", color: "rgba(255,255,255,.6)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{emptyTitle}</div>
                <div style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.5 }}>{emptyBody}</div>
              </div>
            )}
            {feed.map((c) => {
              const isReplying = replyTo === c.id;
              return (
                <div key={c.id} style={{ padding: 12, borderRadius: 13, background: c.isCreator ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.05)", border: "1px solid " + (c.isCreator ? "rgba(255,255,255,.24)" : "rgba(255,255,255,.09)"), animation: "mpFade 220ms var(--ease-standard)" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ width: 28, height: 28, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, boxShadow: c.isCreator ? "0 0 0 1.5px #fff" : "none" }}>{initials(c.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.name}</span>
                        {c.isCreator && <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "#1A1B1E", background: "#fff", borderRadius: 4, padding: "2px 6px" }}>Creator</span>}
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.42)" }}>{c.ago}</span>
                        {c.hasTime && <button onClick={c.onJump} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,.12)", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer" }}>▸ {c.time}</button>}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.92)", marginTop: 4 }}>{c.text}</div>
                      <div style={{ display: "flex", gap: 14, marginTop: 7 }}>
                        <button onClick={() => toggleLike(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 600, color: c.liked ? "#fff" : "rgba(255,255,255,.5)", padding: 0 }}><svg width="13" height="13" viewBox="0 0 24 24" fill={c.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>{c.likes}</button>
                        <button onClick={() => openReply(c.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 600, color: isReplying ? "#fff" : "rgba(255,255,255,.5)", padding: 0 }}>Reply</button>
                      </div>
                      {c.replies.length > 0 && (
                        <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.14)", display: "flex", flexDirection: "column", gap: 9 }}>
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
                        <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid rgba(255,255,255,.35)", display: "flex", flexDirection: "column", gap: 8, animation: "mpFade 200ms var(--ease-standard)" }}>
                          <textarea value={replyDraft} onChange={(e) => { autosize(e.target, 150); setReplyDraft(e.target.value); }} placeholder={`Reply to ${c.name}…`} rows={2} ref={replyRef} style={{ width: "100%", resize: "none", minHeight: 64, maxHeight: 150, overflowY: "auto", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 12, padding: "10px 12px", fontSize: 12.5, color: "#fff", outline: "none", lineHeight: 1.5, fontFamily: "var(--font-ui)" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" style={{ width: 32, height: 32, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.16)", borderRadius: 8, background: emojiOpen ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)", color: "rgba(255,255,255,.75)", cursor: "pointer", transition: "all 150ms" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg></button>
                            <button aria-label="Attach file" style={{ width: 32, height: 32, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.16)", borderRadius: 8, background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.75)", cursor: "pointer" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg></button>
                            <span style={{ flex: 1 }} />
                            <button onClick={cancelReply} style={{ minHeight: 32, padding: "0 13px", background: "none", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, color: "rgba(255,255,255,.7)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-ui)" }}>Cancel</button>
                            <button onClick={() => sendReply(c.id)} aria-label="Send reply" style={{ width: 34, height: 34, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 999, cursor: replyDraft.trim() ? "pointer" : "not-allowed", background: replyDraft.trim() ? "#fff" : "rgba(255,255,255,.12)", color: replyDraft.trim() ? "#1A1B1E" : "rgba(255,255,255,.4)", transition: "all 150ms" }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
                          </div>
                          {emojiOpen && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }}>
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
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea value={draft} onChange={(e) => { autosize(e.target, 132); setDraft(e.target.value); }} placeholder={composerPlaceholder} rows={1} ref={composerRef} style={{ width: "100%", resize: "none", minHeight: 38, maxHeight: 132, overflowY: "auto", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 11, padding: "9px 12px", fontSize: 13, color: "#fff", outline: "none", lineHeight: 1.4, fontFamily: "var(--font-ui)" }} />
              </div>
              {panelView === "feed" && (
                <div style={{ position: "relative", flex: "none" }}>
                  <button onClick={startScene} onMouseEnter={() => setShowAttachTip(true)} onMouseLeave={() => setShowAttachTip(false)} aria-label="Comment on a scene" style={{ width: 38, height: 38, flex: "none", border: "1px solid rgba(255,255,255,.16)", borderRadius: 11, cursor: "pointer", background: sceneMode ? "#fff" : "rgba(255,255,255,.06)", color: sceneMode ? "#1A1B1E" : "rgba(255,255,255,.8)", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="7" y1="8" x2="7" y2="16" /><line x1="13" y1="6" x2="13" y2="18" /><line x1="19" y1="9" x2="19" y2="15" /></svg>
                  </button>
                  {showAttachTip && (
                    <div style={{ position: "absolute", bottom: 46, right: 0, width: 210, padding: "10px 12px", borderRadius: 12, background: "rgba(20,21,24,.96)", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 14px 40px rgba(0,0,0,.55)", zIndex: 50, animation: "mpFade 140ms var(--ease-standard)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Comment on a scene</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.62)", lineHeight: 1.45, marginTop: 3 }}>Attach your comment to a specific moment in the film.</div>
                    </div>
                  )}
                </div>
              )}
              <button onClick={postComment} aria-label="Post" style={{ width: 38, height: 38, flex: "none", border: "none", borderRadius: 11, cursor: "pointer", background: draft.trim() ? "#fff" : "rgba(255,255,255,.08)", color: draft.trim() ? "#1A1B1E" : "rgba(255,255,255,.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
