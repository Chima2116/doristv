"use client";

import { useState, CSSProperties } from "react";
import { useApp } from "@/lib/store";
import { useHover } from "@/hooks/useHover";
import { useViewport } from "@/hooks/useViewport";
import { INITIAL_POSTS, POPULAR_CREATORS, initials, type ForumPost, type ForumReply } from "@/lib/data";
import { chipStyle } from "@/lib/uiStyles";

const CATEGORIES = ["All", "Discussion", "Crew Call", "Funding", "Feedback", "Festivals", "Production Diaries", "Announcements"];
const TAG_COLORS: Record<string, [string, string]> = {
  Funding: ["var(--accent-subtle)", "var(--accent)"],
  "Crew Call": ["var(--info-subtle)", "var(--info)"],
  Feedback: ["var(--success-subtle)", "var(--success)"],
  Discussion: ["rgba(255,255,255,.08)", "var(--text-secondary)"],
};
function tagStyle(cat: string): CSSProperties {
  const [bgc, color] = TAG_COLORS[cat] || TAG_COLORS.Discussion;
  return { fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", background: bgc, color, borderRadius: 4, padding: "3px 8px" };
}
function avatarStyle(isCreator: boolean): CSSProperties {
  return { width: 28, height: 28, flex: "none", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, background: "var(--surface-3)", color: isCreator ? "var(--accent)" : "var(--text-secondary)", boxShadow: isCreator ? "0 0 0 2px var(--accent)" : "none" };
}

function PostCard({ post, onOpen }: { post: ForumPost; onOpen: () => void }) {
  const { style, handlers } = useHover(
    { display: "block", width: "100%", padding: 16, borderRadius: 14, background: "var(--surface-1)", border: "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)", transition: "border-color 200ms var(--ease-standard), transform 200ms var(--ease-standard)" } as CSSProperties,
    { border: "1px solid var(--border-strong)", transform: "translateY(-2px)" }
  );
  return (
    <button onClick={onOpen} style={style} {...handlers}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "none", paddingTop: 2 }}>
          <span style={{ color: "var(--text-tertiary)" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 11l6-6 6 6" /></svg></span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{post.likes}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={tagStyle(post.category)}>{post.category}</span><span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{post.author} · {post.timeAgo}</span></div>
          <h3 style={{ margin: "9px 0 0", fontSize: 16.5, fontWeight: 700, lineHeight: 1.3 }}>{post.title}</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 11, fontSize: 12.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}><span>💬 {post.replies} replies</span><span>♥ {post.likes}</span><span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "var(--text-secondary)" }}>Open discussion →</span></div>
        </div>
      </div>
    </button>
  );
}

export default function CommunityPage() {
  const { isDesktop } = useViewport();
  const { followedSet, toggleFollow, showToast } = useApp();
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"trending" | "newest" | "discussed">("trending");
  const [sortMenu, setSortMenu] = useState(false);
  const [category, setCategory] = useState("All");
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);
  const [threadLiked, setThreadLiked] = useState<Record<number, boolean>>({});
  const [threadReplies, setThreadReplies] = useState<Record<number, ForumReply[]>>({});
  const [threadDraft, setThreadDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [newCat, setNewCat] = useState("Discussion");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const q = search.trim().toLowerCase();
  let filtered = posts.filter((p) => (category === "All" || p.category === category) && (!q || (p.title + " " + p.excerpt + " " + p.author).toLowerCase().includes(q)));
  if (sort === "newest") filtered = filtered.slice().sort((a, b) => b.id - a.id);
  else if (sort === "discussed") filtered = filtered.slice().sort((a, b) => b.replies - a.replies);
  else filtered = filtered.slice().sort((a, b) => (b.likes + b.replies * 2) - (a.likes + a.replies * 2));
  const pinned = !q && sort === "trending" ? filtered.find((p) => p.pinned) : null;
  const feed = filtered.filter((p) => !p.pinned);
  const activeConvos = posts.slice().sort((a, b) => b.replies - a.replies).slice(0, 3);

  const openThread = posts.find((p) => p.id === openThreadId) || null;
  const tLiked = openThread ? !!threadLiked[openThread.id] : false;
  const allReplies: ForumReply[] = openThread ? [...openThread.thread, ...(threadReplies[openThread.id] || [])] : [];

  const postThread = () => {
    const t = newTitle.trim();
    if (!t) return;
    showToast("Posted to Community");
    setPosts((prev) => [{ id: Date.now(), category: newCat, title: t, excerpt: newBody.trim() || "—", body: newBody.trim() || "—", author: "You", replies: 0, likes: 0, timeAgo: "now", thread: [] }, ...prev]);
    setShowComposer(false); setNewTitle(""); setNewBody(""); setCategory("All");
  };
  const postThreadReply = () => {
    const t = threadDraft.trim();
    if (!t || !openThread) return;
    showToast("Reply posted");
    setThreadReplies((prev) => ({ ...prev, [openThread.id]: [...(prev[openThread.id] || []), { name: "You", ago: "now", text: t }] }));
    setThreadDraft("");
  };

  const sortLabels = { trending: "Trending", newest: "Newest", discussed: "Most discussed" };

  return (
    <div style={{ width: "100%", maxWidth: 1080, margin: "0 auto", padding: "32px clamp(16px, 4vw, 32px) 56px", display: "flex", flexDirection: "column", gap: 24, animation: "dorisRise 300ms var(--ease-standard)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(28px, 6vw, 38px)", letterSpacing: "-0.02em" }}>Community</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "var(--text-secondary)", maxWidth: 560 }}>Where Nigerian independent film gets made — funding, crew calls, honest feedback, and the conversations behind the camera.</p>
        </div>
        <button onClick={() => setShowComposer(true)} style={{ minHeight: 46, padding: "0 22px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>+ New post</button>
      </div>

      <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 24, alignItems: isDesktop ? "flex-start" : "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "0 14px", height: 42 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions, crew calls, filmmakers" style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 13.5, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }} />
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setSortMenu((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 42, padding: "0 15px", border: "1px solid var(--border-strong)", borderRadius: 999, cursor: "pointer", background: sortMenu ? "var(--surface-2)" : "var(--surface-1)", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h12M3 12h9M3 18h6" /></svg>{sortLabels[sort]}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {sortMenu && (
                <div style={{ position: "absolute", top: 48, right: 0, width: 180, padding: 6, borderRadius: 12, background: "var(--surface-3)", border: "1px solid var(--border-strong)", boxShadow: "0 18px 50px rgba(0,0,0,.5)", zIndex: 20, animation: "dorisRise 150ms var(--ease-standard)" }}>
                  {(["trending", "newest", "discussed"] as const).map((k) => (
                    <button key={k} onClick={() => { setSort(k); setSortMenu(false); }} style={{ display: "block", width: "100%", minHeight: 34, padding: "0 10px", border: "none", borderRadius: 8, cursor: "pointer", background: sort === k ? "rgba(255,255,255,.1)" : "transparent", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: 12.5, fontWeight: sort === k ? 700 : 600, textAlign: "left" }}>{sortLabels[k]}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => <button key={c} onClick={() => setCategory(c)} style={chipStyle(category === c)}>{c}</button>)}
          </div>

          {feed.length === 0 && !pinned && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "56px 24px", background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>No posts here yet</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Try another category, or start the conversation.</div>
              <button onClick={() => setShowComposer(true)} style={{ marginTop: 6, minHeight: 42, padding: "0 20px", border: "none", borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>+ New post</button>
            </div>
          )}

          {pinned && (
            <button onClick={() => setOpenThreadId(pinned.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "linear-gradient(120deg, var(--surface-2) 0%, var(--surface-1) 70%)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 18, padding: 24, cursor: "pointer", fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "3px 8px" }}>📌 Pinned</span>
                <span style={tagStyle(pinned.category)}>{pinned.category}</span>
              </div>
              <h2 style={{ margin: "14px 0 0", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{pinned.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>{pinned.excerpt}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
                <span style={avatarStyle(!!pinned.isCreator)}>{initials(pinned.author)}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{pinned.author}</span>
                {pinned.isCreator && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "2px 6px" }}>Creator</span>}
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>· {pinned.timeAgo}</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 12.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}><span>💬 {pinned.replies}</span><span>♥ {pinned.likes}</span></span>
              </div>
            </button>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {feed.map((p) => <PostCard key={p.id} post={p} onOpen={() => setOpenThreadId(p.id)} />)}
          </div>
        </div>

        <aside style={{ width: isDesktop ? 280 : "100%", flex: "none", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(135deg, var(--surface-2), var(--surface-1))", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>This week</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>Active threads</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>128</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>Crew calls</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>34</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text-secondary)" }}>Funding requests</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>19</span></div>
            </div>
          </div>

          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Popular creators</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {POPULAR_CREATORS.map((c) => {
                const fw = !!followedSet[c.n];
                return (
                  <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface-3)", boxShadow: "0 0 0 2px var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--accent)", flex: "none" }}>{initials(c.n)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.n}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{c.f} followers</div></div>
                    <button onClick={() => toggleFollow(c.n)} style={{ flex: "none", minHeight: 30, padding: "0 13px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 11.5, fontWeight: 700, background: fw ? "rgba(255,255,255,.1)" : "var(--accent)", color: fw ? "var(--text-primary)" : "var(--text-on-accent)" }}>{fw ? "Following" : "Follow"}</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 14 }}>Active conversations</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {activeConvos.map((p) => (
                <button key={p.id} onClick={() => setOpenThreadId(p.id)} style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 10px", margin: "0 -10px", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-ui)" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.title}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>💬 {p.replies} · {p.timeAgo}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Community guidelines</div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "var(--text-secondary)" }}>Be generous with feedback. Credit collaborators. No piracy, no spam. Filmmakers first.</p>
          </div>
        </aside>
      </div>

      {openThread && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpenThreadId(null); }} style={{ position: "fixed", inset: 0, background: "rgba(10,11,13,.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px, 4vw, 32px)", zIndex: 70 }}>
          <div style={{ width: "100%", maxWidth: 680, maxHeight: "88vh", display: "flex", flexDirection: "column", background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 20, boxShadow: "0 40px 120px rgba(0,0,0,.7)", overflow: "hidden", animation: "dorisRise 260ms var(--ease-standard)" }}>
            <div style={{ flex: "none", padding: "22px 24px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={tagStyle(openThread.category)}>{openThread.category}</span>
                <span style={{ flex: 1 }} />
                <button onClick={() => setOpenThreadId(null)} aria-label="Close" style={{ width: 32, height: 32, border: "none", borderRadius: 999, background: "rgba(255,255,255,.08)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15 }}>✕</button>
              </div>
              <h2 style={{ margin: "14px 0 0", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{openThread.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={avatarStyle(!!openThread.isCreator)}>{initials(openThread.author)}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{openThread.author}</span>
                {openThread.isCreator && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "2px 6px" }}>Creator</span>}
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>· {openThread.timeAgo}</span>
              </div>
            </div>
            <div className="doris-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px", minHeight: 0 }}>
              <p style={{ margin: "0 0 20px", fontSize: 14.5, lineHeight: 1.7, color: "var(--text-primary)" }}>{openThread.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 18, borderBottom: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-secondary)" }}>
                <button onClick={() => setThreadLiked((prev) => ({ ...prev, [openThread.id]: !prev[openThread.id] }))} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, color: tLiked ? "var(--accent)" : "var(--text-secondary)", padding: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={tLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>{openThread.likes + (tLiked ? 1 : 0)}
                </button>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>💬 {allReplies.length} replies</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
                {allReplies.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 11 }}>
                    <span style={avatarStyle(!!r.isCreator)}>{initials(r.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</span>
                        {r.isCreator && <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-on-accent)", background: "var(--accent)", borderRadius: 4, padding: "2px 6px" }}>Creator</span>}
                        <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{r.ago}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>{r.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: "none", padding: "14px 24px 18px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea value={threadDraft} onChange={(e) => setThreadDraft(e.target.value)} placeholder="Add a reply…" rows={1} style={{ flex: 1, resize: "none", minHeight: 42, background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: "11px 13px", fontSize: 13.5, color: "var(--text-primary)", outline: "none", lineHeight: 1.4, fontFamily: "var(--font-ui)" }} />
              <button onClick={postThreadReply} style={{ width: 42, height: 42, flex: "none", border: "none", borderRadius: 12, cursor: "pointer", background: threadDraft.trim() ? "var(--accent)" : "rgba(255,255,255,.1)", color: threadDraft.trim() ? "var(--text-on-accent)" : "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 150ms" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {showComposer && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowComposer(false); }} style={{ position: "fixed", inset: 0, background: "var(--surface-overlay)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div style={{ width: "100%", maxWidth: 520, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 14, boxShadow: "0 16px 48px rgba(0,0,0,.65)", padding: 22, animation: "dorisRise 250ms var(--ease-standard)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 800 }}>New post</span>
              <button onClick={() => setShowComposer(false)} style={{ width: 30, height: 30, border: "none", borderRadius: 999, background: "rgba(255,255,255,.08)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 15 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {["Discussion", "Funding", "Crew Call", "Feedback"].map((c) => <button key={c} onClick={() => setNewCat(c)} style={chipStyle(newCat === c)}>{c}</button>)}
            </div>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title — be specific" style={{ width: "100%", minHeight: 44, background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "0 14px", fontSize: 14, color: "var(--text-primary)", outline: "none", marginBottom: 10 }} />
            <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="What do you want to ask or share?" rows={4} style={{ width: "100%", resize: "none", background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5, color: "var(--text-primary)", outline: "none", lineHeight: 1.5 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button onClick={() => setShowComposer(false)} style={{ minHeight: 42, padding: "0 18px", background: "none", border: "1px solid var(--border-strong)", borderRadius: 999, color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={postThread} style={{ minHeight: 42, padding: "0 20px", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 800, background: newTitle.trim() ? "var(--accent)" : "rgba(255,255,255,.08)", color: newTitle.trim() ? "var(--text-on-accent)" : "var(--text-tertiary)" }}>Post to Community</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
