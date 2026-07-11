export interface PlayerReply {
  id: number;
  name: string;
  ago: string;
  text: string;
  isCreator?: boolean;
  likes?: number;
}

export type MomentType = "community" | "creator" | "discussed" | "featured";

export interface Moment {
  id: number;
  at: number;
  end?: number;
  type: MomentType;
  title?: string;
  thread: PlayerReply[];
}

export const DURATION = 5880;

export const SCENES = [
  { at: 0, name: "Opening titles", pos: "50% 20%" },
  { at: 372, name: "The lagoon at dawn", pos: "20% 40%" },
  { at: 1490, name: "The market argument", pos: "70% 35%" },
  { at: 2530, name: "Golden hour on the water", pos: "50% 30%" },
  { at: 3320, name: "Director's framing", pos: "35% 25%" },
  { at: 3650, name: "The storm breaks", pos: "60% 50%" },
  { at: 4210, name: "Return to Makoko", pos: "40% 45%" },
  { at: 4710, name: "The confession", pos: "55% 30%" },
  { at: 5100, name: "The lagoon keeps its secret", pos: "45% 55%" },
];

export function sceneAt(t: number) {
  let best = SCENES[0];
  for (const sc of SCENES) if (t >= sc.at - 20) best = sc;
  return best;
}

export const INITIAL_GENERAL: PlayerReply[] = [
  { id: 101, name: "Adaeze U.", ago: "1d", text: "One of the most beautiful Nigerian films I've seen this year. The restraint in the storytelling is masterful.", likes: 52 },
  { id: 102, name: "Kemi Adetiba", isCreator: true, ago: "4d", text: "Thank you all for the love. This film took three years — reading your comments makes every day of it worth it.", likes: 140 },
  { id: 103, name: "Emeka O.", ago: "3d", text: "Slow in the middle but the ending absolutely earns it. Would watch again tonight.", likes: 18 },
];

export const INITIAL_MOMENTS: Moment[] = [
  { id: 1, at: 372, type: "community", thread: [
    { id: 11, name: "Amara N.", ago: "2h", text: "That opening drone shot over the lagoon — I actually gasped.", likes: 24 },
    { id: 12, name: "Bola I.", ago: "1d", text: "The sound design here. Water and wind only. Brave.", likes: 7 },
  ] },
  { id: 2, at: 1490, type: "community", thread: [
    { id: 21, name: "Tunde O.", ago: "5h", text: "The market scene dialogue is razor sharp. Whole row was laughing.", likes: 12 },
    { id: 22, name: "Ngozi A.", ago: "4h", text: "The vendors are real Makoko traders — you can tell.", likes: 5 },
  ] },
  { id: 3, at: 2530, type: "discussed", thread: [
    { id: 31, name: "Kemi Adetiba", isCreator: true, ago: "3d", text: "We waited three days on that shoreline for this exact light. Worth every mosquito bite.", likes: 86 },
    { id: 32, name: "Chidi E.", ago: "2d", text: "Golden hour on the water is unreal. This is my wallpaper now.", likes: 41 },
    { id: 33, name: "Bola I.", ago: "1d", text: "The score swells right as the boat turns — chills.", likes: 9 },
  ] },
  { id: 4, at: 3320, type: "creator", thread: [
    { id: 41, name: "Kemi Adetiba", isCreator: true, ago: "3d", text: "Director's note: this frame mirrors the opening shot, inverted. Yemisi is now the one being watched.", likes: 63 },
  ] },
  { id: 5, at: 3650, type: "community", thread: [
    { id: 51, name: "Ifeoma", ago: "1d", text: "The storm sequence — did they shoot this practically?! Incredible.", likes: 19 },
  ] },
  { id: 6, at: 4210, type: "community", thread: [
    { id: 61, name: "Seyi O.", ago: "2d", text: "Coming back to Makoko hits so much harder after everything.", likes: 15 },
  ] },
  { id: 7, at: 4710, end: 4980, type: "featured", title: "Does the confession scene betray Yemisi?", thread: [
    { id: 71, name: "Uche", ago: "6h", text: "Hot take: the confession is the only honest moment in the film.", likes: 33 },
    { id: 72, name: "Amara N.", ago: "5h", text: "Disagree — she's performing honesty. Watch her hands.", likes: 28 },
    { id: 73, name: "Kemi Adetiba", isCreator: true, ago: "2h", text: "Reading this thread with a huge grin. You're both right.", likes: 54 },
  ] },
  { id: 8, at: 5100, type: "community", thread: [
    { id: 81, name: "Uche", ago: "1d", text: "That final shot. I sat through the whole credits.", likes: 33 },
  ] },
];

export function typeMeta(type: MomentType) {
  if (type === "creator") return { label: "Creator note", bg: "#fff", color: "#1A1B1E", border: undefined as string | undefined };
  if (type === "discussed") return { label: "Most discussed", bg: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.32)" };
  if (type === "featured") return { label: "Featured discussion", bg: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.32)" };
  return { label: "Community", bg: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)", border: undefined as string | undefined };
}

export const EMOJIS = ["👏", "🔥", "😂", "😮", "❤️", "💯", "🎬", "😢", "👀", "🙌", "✨", "🥲"];
