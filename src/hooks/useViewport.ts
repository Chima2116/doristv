"use client";

import { useEffect, useState } from "react";

// Matches the two breakpoints used across every responsive layout decision in the app —
// below 768 is a phone, 768-1023 is a tablet, 1024+ is desktop. Defaults to desktop until
// the first effect runs (SSR has no window), which is the safer mismatch to eat since most
// visits are desktop and the flash — if any — is a single paint before hydration.
const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

export function useViewport() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMobile = width != null && width <= MOBILE_MAX;
  const isTablet = width != null && width > MOBILE_MAX && width <= TABLET_MAX;
  const isDesktop = width == null || width > TABLET_MAX;
  return { width, isMobile, isTablet, isDesktop };
}
