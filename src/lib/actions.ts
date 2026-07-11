"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { film } from "@/lib/data";

/** Shared navigation + rent-gate behavior, used by every card / CTA across the app. */
export function useFilmActions() {
  const router = useRouter();
  const { rented, openPay } = useApp();

  const openDetail = (id: number) => router.push(`/title/${id}`);
  const openPlayer = (id: number, at?: number) => router.push(`/watch/${id}${at != null ? `?at=${Math.round(at)}` : ""}`);
  const openCreator = (name: string) => router.push(`/creator/${encodeURIComponent(name)}`);

  /** Rent-gate: free/premium/already-rented plays immediately; rent-tier opens the payment sheet.
   * `at` is only passed by callers resuming a specific moment (Continue Watching, a comment's
   * jump-to-time) — a fresh Play/Watch click omits it, so the player starts from the beginning. */
  const rentOrPlay = (id: number, at?: number) => {
    const f = film(id);
    if (f.tier === "rent" && !rented[id]) {
      openPay(id);
      return;
    }
    openPlayer(id, at);
  };

  return { router, openDetail, openPlayer, openCreator, rentOrPlay };
}
