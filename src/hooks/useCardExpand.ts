"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ExpandPhase = "idle" | "entering" | "open" | "leaving";

const CLOSE_DELAY = 120;
const EXIT_DURATION = 200;

/**
 * Drives a Netflix/MUBI-style hover-expand card. The trigger element stays in normal
 * flow (grid/row layout never reflows); a portal is mounted only while `active` and
 * positioned from the trigger's rect. `settled` flips true one frame after mount so
 * CSS transitions animate in, and flips false on close so the same transition plays
 * in reverse before unmount.
 */
export function useCardExpand<T extends HTMLElement>() {
  const triggerRef = useRef<T | null>(null);
  const [phase, setPhase] = useState<ExpandPhase>("idle");
  const [rect, setRect] = useState<DOMRect | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deliberately split from the enter-timer clearing below. `open()` can be called
  // multiple times in a row while already "entering" (a real hover fires mouseenter
  // on both the resting card and, once it mounts, the portal on top of it) — if that
  // cancelled the in-flight enter timer too, and `setPhase` bails out because the phase
  // value hasn't actually changed, nothing would ever reschedule it and the card would
  // get stuck invisible forever. Only closing needs to be interrupted here.
  const clearCloseTimers = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    if (exitTimer.current) { clearTimeout(exitTimer.current); exitTimer.current = null; }
  };
  const clearEnterTimer = () => {
    if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null; }
  };

  const open = useCallback(() => {
    clearCloseTimers();
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setPhase((p) => (p === "open" ? "open" : "entering"));
  }, []);

  // A short timeout (not requestAnimationFrame) forces the browser to paint the
  // starting position/size before the "open" style change triggers the CSS transition.
  // rAF can be suspended indefinitely for backgrounded/non-composited tabs, which would
  // leave the card stuck invisible with no way to recover — setTimeout doesn't have
  // that failure mode.
  useEffect(() => {
    if (phase !== "entering") return;
    enterTimer.current = setTimeout(() => setPhase("open"), 20);
    return clearEnterTimer;
  }, [phase]);

  const scheduleClose = useCallback(() => {
    clearCloseTimers();
    closeTimer.current = setTimeout(() => {
      setPhase("leaving");
      exitTimer.current = setTimeout(() => setPhase("idle"), EXIT_DURATION);
    }, CLOSE_DELAY);
  }, []);

  useEffect(() => () => { clearCloseTimers(); clearEnterTimer(); }, []);

  return {
    triggerRef,
    active: phase !== "idle",
    settled: phase === "open",
    rect,
    open,
    scheduleClose,
  };
}
