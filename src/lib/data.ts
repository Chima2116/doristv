export { initials, naira } from "@/lib/format";

export type Tier = "free" | "rent" | "premium";

export interface Film {
  id: number;
  title: string;
  tier: Tier;
  price?: number;
  runtime: string;
  genre: string;
  year: number;
  creator: string;
  comments: number;
  synopsis: string;
  language: string;
  trending?: boolean;
  trailerUrl?: string;
  /** Only set for creator-uploaded films (see uploadTypes.ts) — real object/remote URLs
   * that take priority over the static IMGS/GRADS lookup in bg()/filmBg(). */
  posterUrl?: string;
  backdropUrl?: string;
}

/** Hover-preview clips (muted/looped, Netflix-style). Placeholder public sample footage
 * standing in for real trailers until each film has its own cut — rotated across a small
 * set of reliably-hosted CORS-enabled clips (the video element falls back to the still
 * poster on any load error, see FilmCard's ExpandedCard). */
const CLIP_A = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const CLIP_B = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4";
const CLIP_C = "https://vjs.zencdn.net/v/oceans.mp4";

export const TRAILERS: Record<number, string> = {
  1: CLIP_C, 2: CLIP_B, 3: CLIP_A, 4: CLIP_C, 5: CLIP_B, 6: CLIP_A, 7: CLIP_C, 8: CLIP_B,
};

export const IMGS: Record<number, string> = {
  1: "/films/film-weight-of-water.png",
  2: "/films/film-third-mainland.png",
  3: "/films/film-harmattan-bride.png",
  4: "/films/film-danfo-nights.png",
};

export const GRADS: Record<number, string> = {
  1: "linear-gradient(120deg,#2b1d0f 0%,#5a3a17 45%,#c8842a 130%)",
  2: "linear-gradient(135deg,#101a26 0%,#1c2a3a 55%,#31261c 100%)",
  3: "linear-gradient(135deg,#241420 0%,#3a2030 55%,#2a1a14 100%)",
  4: "linear-gradient(135deg,#1c2410 0%,#2c3a1a 55%,#3a2e14 100%)",
  5: "linear-gradient(135deg,#141c24 0%,#243040 55%,#1e2a20 100%)",
  6: "linear-gradient(135deg,#20160e 0%,#34241a 55%,#141e28 100%)",
  7: "linear-gradient(135deg,#160e1c 0%,#241a30 55%,#301a24 100%)",
  8: "linear-gradient(135deg,#0e1a18 0%,#1a2e2a 55%,#28241a 100%)",
};

const FALLBACK_GRAD = "linear-gradient(135deg,#1c1e22 0%,#2a2c31 55%,#1e2024 100%)";

export function bg(id: number, pos?: string): string {
  return IMGS[id] ? `url("${IMGS[id]}") center ${pos || "center"} / cover no-repeat` : GRADS[id] || FALLBACK_GRAD;
}

/** Same as bg(), but honors a creator-uploaded film's real poster/backdrop over the
 * static catalog lookup. Use this instead of bg() anywhere a Film could be user-uploaded. */
export function filmBg(f: Film, pos?: string, useBackdrop?: boolean): string {
  const url = useBackdrop ? f.backdropUrl : f.posterUrl;
  return url ? `url("${url}") center ${pos || "center"} / cover no-repeat` : bg(f.id, pos);
}

export function rating(f: Film): string {
  return (7.6 + ((f.id * 0.23) % 2)).toFixed(1);
}

export const FILMS: Film[] = [
  { id: 1, title: "The Weight of Water", tier: "free", runtime: "1h 38m", genre: "Drama", year: 2024, creator: "Kemi Adetiba", comments: 214, synopsis: "Yemisi left Makoko at seventeen and swore she would never come back. When her father's fishing boat is found empty on the lagoon, she returns to a community that remembers everything — and to the one secret the water has kept for her. Shot over two rainy seasons on the Lagos lagoon.", language: "English · Yoruba", trending: true, trailerUrl: TRAILERS[1] },
  { id: 2, title: "Third Mainland", tier: "rent", price: 800, runtime: "1h 52m", genre: "Thriller", year: 2025, creator: "C.J. Obasi", comments: 96, synopsis: "One night, one bridge, three strangers whose lives collide between the mainland and the island. A slow-burn Lagos thriller told almost entirely in real time.", language: "English", trailerUrl: TRAILERS[2] },
  { id: 3, title: "Harmattan Bride", tier: "premium", runtime: "1h 41m", genre: "Romance", year: 2024, creator: "Amara Nwosu", comments: 71, synopsis: "A wedding photographer who has never believed in marriage takes one last job in Kano — during the driest harmattan in forty years.", language: "English · Hausa", trailerUrl: TRAILERS[3] },
  { id: 4, title: "Danfo Nights", tier: "free", runtime: "1h 24m", genre: "Comedy", year: 2025, creator: "Seyi Ogunde", comments: 158, synopsis: "A broke university graduate inherits his uncle's danfo bus — and every debt, passenger, and ghost that comes with it.", language: "English · Yoruba · Pidgin", trailerUrl: TRAILERS[4] },
  { id: 5, title: "The Tailor of Yaba", tier: "rent", price: 500, runtime: "1h 33m", genre: "Drama", year: 2023, creator: "Amara Nwosu", comments: 44, synopsis: "Fifty years at one sewing machine. When the market is scheduled for demolition, Baba Rasheed takes his final measurements.", language: "English · Yoruba", trailerUrl: TRAILERS[5] },
  { id: 6, title: "Salt & Palm", tier: "free", runtime: "1h 47m", genre: "Family", year: 2024, creator: "Seyi Ogunde", comments: 62, synopsis: "Two half-sisters inherit their grandmother's palm oil business — and her rivalry with the neighbouring compound.", language: "English · Igbo", trailerUrl: TRAILERS[6] },
  { id: 7, title: "Ojuelegba Junction", tier: "premium", runtime: "1h 29m", genre: "Anthology", year: 2025, creator: "C.J. Obasi", comments: 88, synopsis: "Five stories, one junction, twenty-four hours. An anthology of the city that never slows down.", language: "English · Pidgin", trending: true, trailerUrl: TRAILERS[7] },
  { id: 8, title: "Second Rain", tier: "free", runtime: "1h 36m", genre: "Drama", year: 2023, creator: "Kemi Adetiba", comments: 39, synopsis: "After the flood took the farm, the Adeyemi family waits for the second rain — the one that decides everything.", language: "English · Yoruba", trailerUrl: TRAILERS[8] },
];

export function film(id: number | null | undefined): Film {
  return FILMS.find((f) => f.id === id) || FILMS[0];
}

export const SCENES = [
  { at: 372, name: "The lagoon at dawn", grad: "linear-gradient(135deg,#12202b 0%,#1d2f33 55%,#2a2118 100%)" },
  { at: 1490, name: "The market argument", grad: "linear-gradient(135deg,#241a12 0%,#3a2a1a 55%,#20242a 100%)" },
  { at: 2530, name: "Golden hour on the water", grad: "linear-gradient(120deg,#2b1d0f 0%,#5a3a17 45%,#c8842a 130%)" },
  { at: 3650, name: "The storm breaks", grad: "linear-gradient(135deg,#0d1520 0%,#1a2430 55%,#243040 100%)" },
  { at: 4210, name: "Return to Makoko", grad: "linear-gradient(135deg,#161d18 0%,#20302a 55%,#2a2a1e 100%)" },
  { at: 5100, name: "The lagoon keeps its secret", grad: "linear-gradient(135deg,#0c1116 0%,#161d26 60%,#241820 100%)" },
];

export const TAGLINES: Record<number, string> = {
  1: "The lagoon remembers what the living try to forget.",
  2: "One bridge. One night. No way back.",
  3: "In the driest season, the heart still floods.",
  4: "Every passenger has a fare. Every fare has a price.",
  5: "Fifty years at one machine — one last measurement.",
  6: "Blood is thicker. Palm oil is thicker still.",
  7: "Five stories. One junction. Twenty-four hours.",
  8: "After the flood, they wait for the rain that decides everything.",
};

export const CREATOR_BIOS: Record<string, string> = {
  "Kemi Adetiba": "Lagos-based director known for lyrical, water-soaked dramas. Two rainy seasons, one film at a time — and a fierce believer in the DORIS community model.",
  "C.J. Obasi": "Genre filmmaker crafting thrillers and anthologies from the mainland, championing a new wave of Nigerian speculative cinema.",
  "Amara Nwosu": "Tells quiet, luminous stories of love and labour across Kano and Yaba.",
  "Seyi Ogunde": "Comedy with teeth — street-level Lagos energy and a sharp social eye.",
};

export const CREATOR_DB: Record<string, { bio: string; followers: string }> = {
  "Kemi Adetiba": { bio: "Lagos-based director telling lagoon stories. Two rainy seasons, one film at a time.", followers: "12.4k" },
  "C.J. Obasi": { bio: "Genre filmmaker — thrillers and anthologies from the mainland.", followers: "8.1k" },
  "Amara Nwosu": { bio: "Romance and quiet drama from Kano and Yaba.", followers: "5.6k" },
  "Seyi Ogunde": { bio: "Comedy with teeth. Danfo energy.", followers: "4.2k" },
};

export interface ForumReply {
  name: string;
  ago: string;
  text: string;
  isCreator?: boolean;
}

export interface ForumPost {
  id: number;
  category: string;
  pinned?: boolean;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  isCreator?: boolean;
  replies: number;
  likes: number;
  timeAgo: string;
  thread: ForumReply[];
}

export const INITIAL_POSTS: ForumPost[] = [
  { id: 1, category: "Funding", pinned: true, title: "Crowdfunding my second short — lessons from the first", excerpt: "We raised ₦2.4M on the first film. Here's the breakdown of what worked and what I'd never do again.", body: "The first film taught me everything the hard way. We over-promised on perks, under-budgeted post, and nearly lost the sound mix to a delayed payment. This time we structured it in three tranches, kept 15% contingency, and pre-sold festival screener bundles to our most engaged DORIS viewers. Happy to share the exact spreadsheet if it helps anyone.", author: "C.J. Obasi", isCreator: true, replies: 34, likes: 128, timeAgo: "2h", thread: [
    { name: "Amaka E.", ago: "1h", text: "The tranche structure is smart. Did investors push back on the contingency?" },
    { name: "C.J. Obasi", isCreator: true, ago: "1h", text: "One did — I showed them the sound-mix disaster from film one and they stopped arguing." },
    { name: "Tunde O.", ago: "40m", text: "Please share the spreadsheet 🙏" },
  ] },
  { id: 2, category: "Crew Call", title: "Looking for a colourist in Lagos — 12-min short, paid", excerpt: "Shot on FX3, S-Log3. Need someone who's graded skin tones on dark scenes before.", body: "Twelve-minute drama, mostly night interiors and one lagoon dawn sequence. I need someone confident grading rich dark skin tones without crushing detail. Paid, roughly two days. DM me a reel.", author: "Amaka E.", replies: 9, likes: 21, timeAgo: "5h", thread: [
    { name: "Femi K.", ago: "3h", text: "Sent you my reel — did the night market scenes in 'Danfo Nights'." },
    { name: "Amaka E.", ago: "2h", text: "Saw it, that market grade is gorgeous. Replying now." },
  ] },
  { id: 3, category: "Feedback", title: "Rough cut feedback — does the ending land?", excerpt: "Threw together a 3-min teaser. Be brutal, I can take it.", body: "The ending currently cuts to black right after the confession. My editor thinks it needs one more beat on the water. I think the abruptness is the point. What do you feel?", author: "Tunde O.", replies: 47, likes: 63, timeAgo: "1d", thread: [
    { name: "Ngozi A.", ago: "20h", text: "The cut to black gave me chills. Keep it." },
    { name: "Chidi E.", ago: "18h", text: "Counterpoint: one more breath on the water earns the silence." },
  ] },
  { id: 4, category: "Discussion", title: "Timestamped comments changed how I edit", excerpt: "Watching where viewers actually talk on the timeline told me more than any test screening.", body: "I used to guess where audiences drifted. Now I can literally see the comment density collapse at 24:00 and spike again at the confession. I recut the middle eight minutes based on the DORIS heatmap and retention jumped 14%.", author: "Kemi Adetiba", isCreator: true, replies: 52, likes: 201, timeAgo: "2d", thread: [
    { name: "Amara N.", ago: "1d", text: "This is the feature no other platform has. Game changer for indies." },
    { name: "Kemi Adetiba", isCreator: true, ago: "1d", text: "Exactly why I moved my whole catalogue here." },
  ] },
];

export const NOTIF_DEFS = [
  { text: "Kemi Adetiba replied to your comment", sub: "▸ 42:10 · The Weight of Water", accent: true, kind: "player" as const, filmId: 1, at: 2530 },
  { text: "New from C.J. Obasi: Third Mainland", sub: "Just released · ₦800 rent · 48hr window", accent: false, kind: "detail" as const, filmId: 2 },
  { text: "Your comment on Danfo Nights got 12 likes", sub: "▸ 10:10 · Danfo Nights", accent: false, kind: "player" as const, filmId: 4, at: 610 },
];

export const POPULAR_CREATORS = [
  { n: "Kemi Adetiba", f: "12.4k" },
  { n: "C.J. Obasi", f: "8.1k" },
  { n: "Amara Nwosu", f: "5.6k" },
];
