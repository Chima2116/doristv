"use client";

import { useEffect, useState } from "react";

/** Current time as state, ticking every `intervalMs` — avoids calling Date.now() during render. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const kick = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => { clearTimeout(kick); clearInterval(id); };
  }, [intervalMs]);
  return now;
}
