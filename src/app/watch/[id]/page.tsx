"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { FILMS } from "@/lib/data";
import { tierBadge } from "@/lib/uiStyles";
import { MoviePlayer, type PlayerFilm } from "@/components/player/MoviePlayer";

export default function WatchPage() {
  return (
    <Suspense fallback={null}>
      <WatchPageInner />
    </Suspense>
  );
}

function WatchPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publishedFilms } = useApp();
  const atParam = searchParams.get("at");
  const startAt = atParam != null ? Number(atParam) : undefined;

  const id = Number(params.id);
  const staticFilm = FILMS.find((f) => f.id === id);
  const uploaded = publishedFilms.find((f) => f.id === id && f.status === "published");

  // Catalog titles (ids 1-8) have no real footage — they play the placeholder demo clip.
  // A creator upload plays the actual master file that was attached during Upload Assets.
  let film: PlayerFilm | undefined;
  if (staticFilm) {
    film = { id: staticFilm.id, title: staticFilm.title, creator: staticFilm.creator, metaLine: `${staticFilm.year} · ${tierBadge(staticFilm, false).label}`, posterUrl: staticFilm.posterUrl, backdropUrl: staticFilm.backdropUrl };
  } else if (uploaded) {
    film = {
      id: uploaded.id, title: uploaded.title, creator: uploaded.creator, metaLine: `${uploaded.year} · ${uploaded.tier === "rent" ? "Rent" : uploaded.tier === "premium" ? "Premium" : "Free"}`,
      posterUrl: uploaded.posterUrl || undefined, backdropUrl: uploaded.backdropUrl || undefined, videoUrl: uploaded.videoUrl || undefined,
    };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      <MoviePlayer startAt={startAt} onExit={() => router.back()} onEnded={() => router.push(`/title/${id}`)} film={film} />
    </div>
  );
}
