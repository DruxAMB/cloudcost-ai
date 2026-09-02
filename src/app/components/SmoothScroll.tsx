"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LenisContext } from "../lib/lenis-context";

/**
 * Lenis smooth scroll wrapper.
 *
 * Lenis intercepts wheel/touch events and uses NATIVE scroll
 * (no CSS transforms on a content wrapper), so position: sticky
 * and position: fixed continue to work normally.
 *
 * Integrates with GSAP ScrollTrigger via the scroll event —
 * ScrollTrigger.update is called on every Lenis scroll tick.
 *
 * The Lenis instance is provided via `LenisContext` so components that need
 * to programmatically scroll (e.g. driving the horizontal track to a panel)
 * can call `lenis.scrollTo` and get the smoothed motion instead of fighting
 * Lenis with a raw `window.scrollTo`.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    setLenis(instance);

    // Sync Lenis with GSAP ScrollTrigger
    instance.on("scroll", ScrollTrigger.update);

    // Drive Lenis via GSAP's ticker for consistent frame timing
    const tickerCallback = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after Lenis is set up
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tickerCallback);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
