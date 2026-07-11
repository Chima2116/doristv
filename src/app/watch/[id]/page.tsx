"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MoviePlayer } from "@/components/player/MoviePlayer";

export default function WatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const atParam = searchParams.get("at");
  const startAt = atParam != null ? Number(atParam) : undefined;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <MoviePlayer startAt={startAt} onExit={() => router.back()} />
    </div>
  );
}
