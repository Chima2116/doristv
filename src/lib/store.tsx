"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import type { PublishedFilm } from "@/lib/uploadTypes";
import { deleteBlob, filmAssetKey, loadBlob } from "@/lib/mediaStore";

type PayMethod = "card" | "bank" | "ussd";

interface AppState {
  watchLater: number[];
  rented: Record<number, number>;
  likedFilms: Record<number, boolean>;
  followedSet: Record<string, boolean>;
  downloaded: Record<number, boolean>;
  searchQ: string;
  toast: string | null;
  pay: "form" | "success" | null;
  payFilmId: number | null;
  payMethod: PayMethod;
  publishedFilms: PublishedFilm[];
}

interface AppContextValue extends AppState {
  toggleWatchLater: (id: number) => void;
  isInWatchLater: (id: number) => boolean;
  toggleLikeFilm: (id: number) => void;
  toggleFollow: (name: string) => void;
  toggleDownload: (id: number) => void;
  setSearchQ: (v: string) => void;
  showToast: (msg: string) => void;
  openPay: (filmId: number) => void;
  closePay: () => void;
  setPayMethod: (m: PayMethod) => void;
  confirmPay: () => void;
  publishFilm: (film: PublishedFilm) => void;
  getPublishedFilm: (id: number) => PublishedFilm | undefined;
  updateFilm: (id: number, patch: Partial<PublishedFilm>) => void;
  deleteFilm: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const PUBLISHED_KEY = "doris-published-films-v1";

/** Metadata (title, tier, community settings, etc.) is small and JSON-safe, so it's stored
 * directly in localStorage. The actual media (video/poster/backdrop/trailer) lives in
 * IndexedDB instead — see mediaStore.ts and the hydration effect below — since the URLs
 * saved here are already-dead blob: strings by the time they're read back. */
function loadStoredUploads(): PublishedFilm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    return raw ? (JSON.parse(raw) as PublishedFilm[]) : [];
  } catch {
    return [];
  }
}

// Two flagship titles pre-seeded into Studio (negative ids so they can never collide with
// a real upload's Date.now()-based id) so the Films list and Film Dashboard have something
// real to browse in the demo — matching the numbers already shown elsewhere in Studio.
const SEED_FILMS: PublishedFilm[] = [
  {
    id: -1, title: "The Weight of Water", synopsis: "Yemisi left Makoko at seventeen and swore she would never come back. When her father's fishing boat is found empty on the lagoon, she returns to a community that remembers everything.",
    posterUrl: "/films/film-weight-of-water.png", backdropUrl: "/films/film-weight-of-water.png", trailerUrl: null, videoUrl: null,
    runtime: "1h 38m", year: 2024, genres: ["Drama"], languages: ["English", "Yoruba"], country: "Nigeria", ageRating: "PG-13",
    creator: "Kemi Adetiba", crew: [{ id: "seed-1-director", name: "Kemi Adetiba", role: "Director" }],
    tier: "free", community: { timestamped: true, creatorNotes: true, featuredMoments: true },
    status: "published", scheduledAt: null, createdAt: Date.now() - 90 * 86400000,
    stats: { views: "41.9k", watchTime: "1,020 hrs", revenue: "₦148,200", comments: "214", completionPct: 68, score: "9.4" },
  },
  {
    id: -2, title: "Second Rain", synopsis: "After the flood took the farm, the Adeyemi family waits for the second rain — the one that decides everything.",
    posterUrl: "/films/film-danfo-nights.png", backdropUrl: "/films/film-danfo-nights.png", trailerUrl: null, videoUrl: null,
    runtime: "1h 36m", year: 2023, genres: ["Drama"], languages: ["English", "Yoruba"], country: "Nigeria", ageRating: "PG-13",
    creator: "Kemi Adetiba", crew: [{ id: "seed-2-director", name: "Kemi Adetiba", role: "Director" }],
    tier: "premium", community: { timestamped: true, creatorNotes: true, featuredMoments: true },
    status: "published", scheduledAt: null, createdAt: Date.now() - 30 * 86400000,
    stats: { views: "6.3k", watchTime: "210 hrs", revenue: "₦52,300", comments: "39", completionPct: 55, score: "8.1" },
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [watchLater, setWatchLater] = useState<number[]>([4, 3]);
  const [rented, setRented] = useState<Record<number, number>>({});
  const [likedFilms, setLikedFilms] = useState<Record<number, boolean>>({});
  const [followedSet, setFollowedSet] = useState<Record<string, boolean>>({});
  const [downloaded, setDownloaded] = useState<Record<number, boolean>>({ 6: true, 4: true });
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pay, setPay] = useState<"form" | "success" | null>(null);
  const [payFilmId, setPayFilmId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  // Real uploads (positive ids) are read back from localStorage synchronously so a refresh
  // doesn't lose the film entirely — their media URLs are stale blob: strings at this point
  // and get replaced with fresh ones by the hydration effect below, once IndexedDB responds.
  const [publishedFilms, setPublishedFilms] = useState<PublishedFilm[]>(() => [...loadStoredUploads(), ...SEED_FILMS]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rebuild a working object URL for each persisted upload's media from the Blobs saved in
  // IndexedDB at publish time — the URL strings that survived in localStorage are dead the
  // instant the page reloads, so every asset that was actually saved gets a fresh one here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const f of publishedFilms) {
        if (f.id <= 0) continue;
        const [master, poster, backdrop, trailer] = await Promise.all([
          loadBlob(filmAssetKey(f.id, "master")),
          loadBlob(filmAssetKey(f.id, "poster")),
          loadBlob(filmAssetKey(f.id, "backdrop")),
          loadBlob(filmAssetKey(f.id, "trailer")),
        ]);
        if (cancelled) return;
        const patch: Partial<PublishedFilm> = {};
        if (master) patch.videoUrl = URL.createObjectURL(master);
        if (poster) patch.posterUrl = URL.createObjectURL(poster);
        if (backdrop) patch.backdropUrl = URL.createObjectURL(backdrop);
        if (trailer) patch.trailerUrl = URL.createObjectURL(trailer);
        if (Object.keys(patch).length > 0) {
          setPublishedFilms((prev) => prev.map((p) => (p.id === f.id ? { ...p, ...patch } : p)));
        }
      }
    })();
    return () => { cancelled = true; };
    // Intentionally runs once on mount only — publishedFilms updates as a *result* of this
    // effect (patching in fresh URLs), so depending on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep localStorage in sync with every real upload (metadata only) as it changes —
  // publishing, editing settings in the Film Dashboard, deleting, etc.
  useEffect(() => {
    try {
      const uploads = publishedFilms.filter((f) => f.id > 0);
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify(uploads));
    } catch { /* storage full/unavailable */ }
  }, [publishedFilms]);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const isInWatchLater = useCallback((id: number) => watchLater.includes(id), [watchLater]);

  const toggleWatchLater = useCallback((id: number) => {
    setWatchLater((prev) => {
      const inList = prev.includes(id);
      showToast(inList ? "Removed from Watch Later" : "Added to Watch Later");
      return inList ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, [showToast]);

  const toggleLikeFilm = useCallback((id: number) => {
    setLikedFilms((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleFollow = useCallback((name: string) => {
    setFollowedSet((prev) => {
      const next = !prev[name];
      showToast(next ? "Following " + name : "Unfollowed " + name);
      return { ...prev, [name]: next };
    });
  }, [showToast]);

  const toggleDownload = useCallback((id: number) => {
    setDownloaded((prev) => {
      const next = !prev[id];
      showToast(next ? "Downloading for offline" : "Download removed");
      return { ...prev, [id]: next };
    });
  }, [showToast]);

  const openPay = useCallback((filmId: number) => {
    setPayFilmId(filmId);
    setPay("form");
  }, []);
  const closePay = useCallback(() => setPay(null), []);
  const confirmPay = useCallback(() => {
    setPay("success");
    setPayFilmId((id) => {
      if (id != null) setRented((prev) => ({ ...prev, [id]: Date.now() }));
      return id;
    });
  }, []);
  const publishFilm = useCallback((film: PublishedFilm) => {
    setPublishedFilms((prev) => [film, ...prev.filter((f) => f.id !== film.id)]);
  }, []);
  const getPublishedFilm = useCallback((id: number) => publishedFilms.find((f) => f.id === id), [publishedFilms]);
  const updateFilm = useCallback((id: number, patch: Partial<PublishedFilm>) => {
    setPublishedFilms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);
  const deleteFilm = useCallback((id: number) => {
    setPublishedFilms((prev) => prev.filter((f) => f.id !== id));
    if (id > 0) {
      (["master", "poster", "backdrop", "trailer"] as const).forEach((k) => {
        deleteBlob(filmAssetKey(id, k)).catch(() => { /* ignore */ });
      });
    }
    showToast("Film deleted");
  }, [showToast]);

  const value = useMemo<AppContextValue>(() => ({
    watchLater, rented, likedFilms, followedSet, downloaded, searchQ, toast, pay, payFilmId, payMethod, publishedFilms,
    toggleWatchLater, isInWatchLater, toggleLikeFilm, toggleFollow, toggleDownload, setSearchQ, showToast,
    openPay, closePay, setPayMethod, confirmPay, publishFilm, getPublishedFilm, updateFilm, deleteFilm,
  }), [watchLater, rented, likedFilms, followedSet, downloaded, searchQ, toast, pay, payFilmId, payMethod, publishedFilms,
    toggleWatchLater, isInWatchLater, toggleLikeFilm, toggleFollow, toggleDownload, showToast, openPay, closePay, confirmPay, publishFilm, getPublishedFilm, updateFilm, deleteFilm]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
