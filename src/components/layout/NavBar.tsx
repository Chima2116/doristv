"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useFilmActions } from "@/lib/actions";
import { useApp } from "@/lib/store";
import { useViewport } from "@/hooks/useViewport";
import { navStyle } from "@/lib/uiStyles";
import { NOTIF_DEFS } from "@/lib/data";

const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/community", label: "Community" },
  { href: "/my-stuff", label: "My Stuff" },
  { href: "/studio", label: "Studio" },
];

function MenuIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

export function NavBar() {
  const pathname = usePathname();
  const { router, openDetail, openPlayer } = useFilmActions();
  const { searchQ, setSearchQ, showToast } = useApp();
  const { isDesktop } = useViewport();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isHome = pathname === "/";
  const isDetail = pathname.startsWith("/title/");
  const transparent = isHome;

  const navBarStyle = transparent
    ? { width: "100%", position: "sticky" as const, top: 0, zIndex: 30, background: "linear-gradient(to bottom, rgba(20,21,23,.7) 0%, rgba(20,21,23,0) 100%)", borderBottom: "1px solid transparent" }
    : { width: "100%", position: "sticky" as const, top: 0, zIndex: 30, background: "rgba(20,21,23,.92)", borderBottom: "1px solid var(--border-subtle)", backdropFilter: "blur(10px)" };

  const goTo = (href: string) => { setDrawerOpen(false); router.push(href); };

  // Compact header: logo + hamburger + search-icon + notif + profile, all icon-sized so it
  // never overflows a phone width — the full link row and inline search input (which need
  // real horizontal room) move into the slide-down drawer / search bar below instead.
  if (!isDesktop) {
    return (
      <div style={navBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 64, padding: "0 16px" }}>
          {mobileSearchOpen ? (
            <>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "0 14px", height: 40 }}>
                <SearchIcon />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); router.push("/browse"); }}
                  placeholder="Search films, filmmakers"
                  style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}
                />
              </div>
              <button onClick={() => setMobileSearchOpen(false)} aria-label="Close search" style={{ width: 40, height: 40, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 999, background: "none", color: "var(--text-secondary)", cursor: "pointer" }}><CloseIcon /></button>
            </>
          ) : (
            <>
              <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" style={{ width: 40, height: 40, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-strong)", borderRadius: 999, background: "transparent", color: "var(--text-primary)", cursor: "pointer" }}><MenuIcon /></button>
              <button onClick={() => router.push("/")} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: "var(--text-primary)", padding: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                DORIS<span style={{ color: "var(--accent)" }}> TV</span>
              </button>
              <button onClick={() => setMobileSearchOpen(true)} aria-label="Search" style={{ width: 40, height: 40, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-strong)", borderRadius: 999, background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}><SearchIcon /></button>
              <button
                onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setUnread(false); }}
                aria-label="Notifications"
                style={{ position: "relative", width: 40, height: 40, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-strong)", borderRadius: 999, cursor: "pointer", background: notifOpen ? "var(--accent-subtle)" : "transparent", color: notifOpen ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {unread && <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 2px #161719" }} />}
              </button>
              <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }} style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", fontSize: 10.5, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ui)" }}>You</button>
            </>
          )}
        </div>

        {drawerOpen && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }} style={{ position: "fixed", inset: 0, top: 64, background: "rgba(10,11,13,.72)", backdropFilter: "blur(4px)", zIndex: 35, animation: "dorisFadeIn 160ms var(--ease-standard)" }}>
            <div style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-subtle)", padding: "8px 12px 16px", display: "flex", flexDirection: "column", gap: 2, animation: "dorisRise 180ms var(--ease-standard)" }}>
              {LINKS.map((l) => {
                const active = l.href === "/" ? (isHome || isDetail) : pathname.startsWith(l.href);
                return (
                  <button key={l.href} onClick={() => goTo(l.href)} style={{ ...navStyle(active), textAlign: "left", padding: "13px 14px", fontSize: 15.5 }}>{l.label}</button>
                );
              })}
            </div>
          </div>
        )}

        {(notifOpen || profileOpen) && (
          <div onClick={() => { setNotifOpen(false); setProfileOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 34 }} />
        )}

        {notifOpen && (
          <div style={{ position: "absolute", top: 64, right: 16, left: 16, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.65)", overflow: "hidden", zIndex: 40, animation: "dorisRise 200ms var(--ease-standard)" }}>
            <div style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, borderBottom: "1px solid var(--border-subtle)" }}>Notifications</div>
            {NOTIF_DEFS.map((n, i) => (
              <button
                key={i}
                onClick={() => { setNotifOpen(false); if (n.kind === "player") openPlayer(n.filmId, n.at); else openDetail(n.filmId); }}
                style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)" }}
              >
                <span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", marginTop: 5, background: n.accent ? "var(--accent)" : "var(--border-strong)" }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.text}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{n.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {profileOpen && (
          <div style={{ position: "absolute", top: 64, right: 16, width: 250, maxWidth: "calc(100vw - 32px)", background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.65)", overflow: "hidden", zIndex: 40, animation: "dorisRise 200ms var(--ease-standard)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>You</div>
              <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>Free plan · watching with ads</div>
            </div>
            <button onClick={() => { setProfileOpen(false); showToast("Premium · ₦2,500/mo — checkout ships next build"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>★ Go Premium — watch ad-free</button>
            <button onClick={() => { setProfileOpen(false); router.push("/my-stuff"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Viewing history</button>
            <button onClick={() => { setProfileOpen(false); showToast("Settings ship in the next build"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Account settings</button>
            <button onClick={() => { setProfileOpen(false); showToast("Signed out (demo)"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)" }}>Sign out</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={navBarStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, height: 64, padding: "0 clamp(20px, 3.5vw, 84px)" }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", color: "var(--text-primary)", padding: 0, whiteSpace: "nowrap" }}>
          DORIS<span style={{ color: "var(--accent)" }}> TV</span>
        </button>
        <div style={{ display: "flex", gap: 2 }}>
          {LINKS.map((l) => {
            const active = l.href === "/" ? (isHome || isDetail) : pathname.startsWith(l.href);
            return <button key={l.href} onClick={() => router.push(l.href)} style={navStyle(active)}>{l.label}</button>;
          })}
        </div>
        <span style={{ flex: "1 0 8px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", minWidth: 0, flexShrink: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-1)", border: "1px solid var(--border-strong)", borderRadius: 999, padding: "0 14px", height: 40, flex: "0 1 240px", minWidth: 110 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--text-tertiary)", flex: "none" }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); router.push("/browse"); }}
              placeholder="Search films, filmmakers"
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 13.5, color: "var(--text-primary)", fontFamily: "var(--font-ui)" }}
            />
          </div>
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); setUnread(false); }}
            aria-label="Notifications"
            style={{ position: "relative", width: 40, height: 40, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-strong)", borderRadius: 999, cursor: "pointer", background: notifOpen ? "var(--accent-subtle)" : "transparent", color: notifOpen ? "var(--accent)" : "var(--text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            {unread && <span style={{ position: "absolute", top: 9, right: 10, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 0 2px #161719" }} />}
          </button>
          <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }} style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", background: "var(--surface-3)", border: "1px solid var(--border-strong)", color: "var(--text-primary)", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ui)" }}>You</button>

          {notifOpen && (
            <div style={{ position: "absolute", top: 50, right: 48, width: 340, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.65)", overflow: "hidden", zIndex: 40, animation: "dorisRise 200ms var(--ease-standard)" }}>
              <div style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, borderBottom: "1px solid var(--border-subtle)" }}>Notifications</div>
              {NOTIF_DEFS.map((n, i) => (
                <button
                  key={i}
                  onClick={() => { setNotifOpen(false); if (n.kind === "player") openPlayer(n.filmId, n.at); else openDetail(n.filmId); }}
                  style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)" }}
                >
                  <span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", marginTop: 5, background: n.accent ? "var(--accent)" : "var(--border-strong)" }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.text}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{n.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {profileOpen && (
            <div style={{ position: "absolute", top: 50, right: 0, width: 250, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.65)", overflow: "hidden", zIndex: 40, animation: "dorisRise 200ms var(--ease-standard)" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>You</div>
                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>Free plan · watching with ads</div>
              </div>
              <button onClick={() => { setProfileOpen(false); showToast("Premium · ₦2,500/mo — checkout ships next build"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>★ Go Premium — watch ad-free</button>
              <button onClick={() => { setProfileOpen(false); router.push("/my-stuff"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Viewing history</button>
              <button onClick={() => { setProfileOpen(false); showToast("Settings ship in the next build"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Account settings</button>
              <button onClick={() => { setProfileOpen(false); showToast("Signed out (demo)"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 16px", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)" }}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
