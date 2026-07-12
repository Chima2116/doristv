import type { Film } from "@/lib/data";

export type CrewRole = "Director" | "Writer" | "Producer" | "Executive Producer" | "Cast" | "Cinematographer" | "Editor" | "Composer" | "Sound Designer";
export const CREW_ROLES: CrewRole[] = ["Director", "Writer", "Producer", "Executive Producer", "Cast", "Cinematographer", "Editor", "Composer", "Sound Designer"];

export interface CrewMember {
  id: string;
  name: string;
  role: CrewRole;
  character?: string;
}

export type MonetizationTier = "free" | "free_ads" | "rent" | "premium";

export type AssetKind = "image" | "video" | "subtitle";
export type AssetKey = "master" | "poster" | "backdrop" | "trailer" | "subtitles";

export interface AssetSlot {
  fileName: string | null;
  fileSize: number | null;
  objectUrl: string | null;
  kind: AssetKind;
  progress: number;
  status: "empty" | "uploading" | "done";
}

export const ASSET_DEFS: { key: AssetKey; label: string; hint: string; kind: AssetKind; required: boolean; accept: string; aspect: string }[] = [
  { key: "master", label: "Film master", hint: "The finished film, full quality. MP4 or MOV.", kind: "video", required: true, accept: "video/*", aspect: "16/9" },
  { key: "poster", label: "Poster", hint: "Portrait key art — this is the face of your film everywhere on DORIS.", kind: "image", required: true, accept: "image/*", aspect: "2/3" },
  { key: "backdrop", label: "Hero backdrop", hint: "Widescreen still used behind your title on the homepage and detail page.", kind: "image", required: true, accept: "image/*", aspect: "16/9" },
  { key: "trailer", label: "Trailer", hint: "Optional — a short cut viewers see on hover across DORIS.", kind: "video", required: false, accept: "video/*", aspect: "16/9" },
  { key: "subtitles", label: "Subtitles", hint: "Optional — .srt or .vtt caption file.", kind: "subtitle", required: false, accept: ".srt,.vtt", aspect: "" },
];

export const GENRES = ["Drama", "Thriller", "Comedy", "Romance", "Family", "Anthology", "Documentary", "Action", "Horror", "Music"];
export const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Pidgin", "French"];
export const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];
export const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States"];
export const TERRITORY_OPTIONS = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Canada", "France"];

export interface CommunitySettings {
  timestamped: boolean;
  creatorNotes: boolean;
  featuredMoments: boolean;
}

export type FilmStatus = "draft" | "scheduled" | "published";

export interface UploadDraft {
  id: string;
  assets: Record<AssetKey, AssetSlot>;
  title: string;
  synopsis: string;
  runtimeMinutes: string;
  releaseYear: string;
  genres: string[];
  languages: string[];
  country: string;
  ageRating: string;
  crew: CrewMember[];
  tier: MonetizationTier;
  rentPrice: number;
  territoryScope: "worldwide" | "select";
  territories: string[];
  licensing: "exclusive" | "nonexclusive";
  rightsConfirmed: boolean;
  community: CommunitySettings;
  status: FilmStatus;
  scheduledAt: number | null;
  createdAt: number;
}

export function emptyAsset(kind: AssetKind): AssetSlot {
  return { fileName: null, fileSize: null, objectUrl: null, kind, progress: 0, status: "empty" };
}

export function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
}

let filmIdCounter = 0;
/** Numeric ids for published films — deliberately far above the 8 seed catalog ids (1-8)
 * so they can flow through every existing numeric-keyed system (watchLater, likedFilms,
 * downloaded, rented, /title/[id], /watch/[id]) with zero changes to those systems. */
export function newFilmId(): number {
  filmIdCounter += 1;
  return Date.now() + filmIdCounter;
}

export function defaultDraft(): UploadDraft {
  return {
    id: newDraftId(),
    assets: {
      master: emptyAsset("video"), poster: emptyAsset("image"), backdrop: emptyAsset("image"),
      trailer: emptyAsset("video"), subtitles: emptyAsset("subtitle"),
    },
    title: "", synopsis: "", runtimeMinutes: "", releaseYear: String(new Date().getFullYear()),
    genres: [], languages: [], country: "Nigeria", ageRating: "",
    crew: [],
    tier: "free", rentPrice: 800, territoryScope: "worldwide", territories: [],
    licensing: "nonexclusive", rightsConfirmed: false,
    community: { timestamped: true, creatorNotes: true, featuredMoments: true },
    status: "draft", scheduledAt: null, createdAt: Date.now(),
  };
}

/** Only present on the two flagship demo titles seeded into the Studio so their Films
 * list row and dashboard show real numbers instead of an honest zero-state — a genuine
 * new upload never has this. */
export interface FilmStats {
  views: string;
  watchTime: string;
  revenue: string;
  comments: string;
  completionPct: number;
  score: string;
}

/** What actually gets stored once a draft is published/scheduled/saved — the blob object
 * URLs from this browsing session (posters etc. picked via <input type="file">) survive
 * in memory for the session but were never meant to be durable; that's fine for a demo. */
export interface PublishedFilm {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  videoUrl: string | null;
  runtime: string;
  year: number;
  genres: string[];
  languages: string[];
  country: string;
  ageRating: string;
  creator: string;
  crew: CrewMember[];
  tier: MonetizationTier;
  price?: number;
  community: CommunitySettings;
  status: FilmStatus;
  scheduledAt: number | null;
  createdAt: number;
  stats?: FilmStats;
}

export function draftToPublished(d: UploadDraft, id: number, status: FilmStatus): PublishedFilm {
  return {
    id, title: d.title.trim() || "Untitled film", synopsis: d.synopsis,
    posterUrl: d.assets.poster.objectUrl, backdropUrl: d.assets.backdrop.objectUrl, trailerUrl: d.assets.trailer.objectUrl, videoUrl: d.assets.master.objectUrl,
    runtime: d.runtimeMinutes ? `${Math.floor(Number(d.runtimeMinutes) / 60)}h ${Number(d.runtimeMinutes) % 60}m` : "—",
    year: Number(d.releaseYear) || new Date().getFullYear(),
    genres: d.genres, languages: d.languages, country: d.country, ageRating: d.ageRating || "PG-13",
    creator: d.crew.find((c) => c.role === "Director")?.name || d.crew[0]?.name || "Independent filmmaker",
    crew: d.crew, tier: d.tier, price: d.tier === "rent" ? d.rentPrice : undefined,
    community: d.community, status, scheduledAt: d.scheduledAt, createdAt: d.createdAt,
  };
}

/** Renders a creator-uploaded film through the same viewer-facing surfaces (FilmCard,
 * Home rails, Browse, the title detail page) as the static catalog — free_ads collapses
 * to "free" since the viewer-facing tier model doesn't distinguish ad-supported free. */
export function publishedToFilm(p: PublishedFilm): Film {
  return {
    id: p.id, title: p.title, tier: p.tier === "free_ads" ? "free" : p.tier === "free" ? "free" : p.tier,
    price: p.price, runtime: p.runtime, genre: p.genres[0] || "Drama", year: p.year,
    creator: p.creator, comments: 0, synopsis: p.synopsis, language: p.languages.join(" · ") || "English",
    trending: false, trailerUrl: p.trailerUrl || undefined,
    posterUrl: p.posterUrl || undefined, backdropUrl: p.backdropUrl || undefined,
  };
}
