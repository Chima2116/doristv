"use client";

import { useState, useMemo, CSSProperties } from "react";

/** Merges a base style with a hover-only style, replacing the .dc.html `style-hover` attribute. */
export function useHover(base: CSSProperties, hover: CSSProperties) {
  const [hovered, setHovered] = useState(false);
  const style = useMemo(() => (hovered ? { ...base, ...hover } : base), [hovered, base, hover]);
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
  return { style, hovered, handlers };
}
