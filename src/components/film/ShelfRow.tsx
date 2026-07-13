"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useViewport } from "@/hooks/useViewport";

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

const arrowBase: CSSProperties = {
  position: "absolute", top: 0, bottom: 4, width: 56, border: "none", zIndex: 6,
  display: "flex", alignItems: "center", color: "#fff", cursor: "pointer",
  transition: "opacity 200ms var(--ease-standard)",
};

/**
 * Horizontal shelf scroller — Netflix-style. Native touch swipe still works (it's just
 * overflow-x scroll underneath); the visible OS scrollbar is hidden and replaced with
 * hover-revealed arrow buttons that page by ~90% of the visible width.
 */
export function ShelfRow({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  const { isMobile } = useViewport();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  // On phones there's no room for a horizontal carousel to breathe — MUBI's mobile browse
  // stacks one full-width poster per row instead, so titles get real space instead of
  // being squeezed into a swipeable strip of small tiles.
  if (isMobile) {
    return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>;
  }

  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div
        ref={trackRef}
        style={{ display: "flex", gap, overflowX: "auto", overflowY: "hidden", paddingBottom: 4, scrollbarWidth: "none" }}
        className="doris-scroll"
      >
        {children}
      </div>

      <button
        onClick={() => page(-1)}
        aria-label="Scroll left"
        style={{
          ...arrowBase, left: 0, justifyContent: "flex-start", paddingLeft: 4,
          background: "linear-gradient(90deg, rgba(15,16,18,.92) 0%, rgba(15,16,18,0) 100%)",
          opacity: hovering && !atStart ? 1 : 0,
          pointerEvents: hovering && !atStart ? "auto" : "none",
        }}
      >
        <ChevronIcon dir="left" />
      </button>
      <button
        onClick={() => page(1)}
        aria-label="Scroll right"
        style={{
          ...arrowBase, right: 0, justifyContent: "flex-end", paddingRight: 4,
          background: "linear-gradient(270deg, rgba(15,16,18,.92) 0%, rgba(15,16,18,0) 100%)",
          opacity: hovering && !atEnd ? 1 : 0,
          pointerEvents: hovering && !atEnd ? "auto" : "none",
        }}
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
  );
}
