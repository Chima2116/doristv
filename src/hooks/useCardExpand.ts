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
  const raf1 = useRef<number | null>(null);
  const raf2 = useRef<number | null>(null);

  const clearTimers = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    if (raf1.current) cancelAnimationFrame(raf1.current);
    if (raf2.current) cancelAnimationFrame(raf2.current);
  };

  const open = useCallback(() => {
    clearTimers();
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setPhase((p) => (p === "open" ? "open" : "entering"));
  }, []);

  useEffect(() => {
    if (phase !== "entering") return;
    raf1.current = requestAnimationFrame(() => {
      raf2.current = requestAnimationFrame(() => setPhase("open"));
    });
    return () => {
      if (raf1.current) cancelAnimationFrame(raf1.current);
      if (raf2.current) cancelAnimationFrame(raf2.current);
    };
  }, [phase]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = setTimeout(() => {
      setPhase("leaving");
      exitTimer.current = setTimeout(() => setPhase("idle"), EXIT_DURATION);
    }, CLOSE_DELAY);
  }, []);

  useEffect(() => clearTimers, []);

  return {
    triggerRef,
    active: phase !== "idle",
    settled: phase === "open",
    rect,
    open,
    scheduleClose,
  };
}
