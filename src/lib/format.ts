export function fmt(t: number): string {
  t = Math.max(0, Math.round(t));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0");
}

export function initials(n: string): string {
  return n
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function naira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}
