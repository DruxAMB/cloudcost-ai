"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tracks scroll progress (0 → 1) of a tall container relative to the viewport.
 *
 * Returns 0 when the container's top reaches the top of the viewport.
 * Returns 1 when the container's bottom reaches the bottom of the viewport.
 *
 * Uses requestAnimationFrame to throttle scroll events for smooth performance.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>
): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      rafRef.current = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = el.offsetHeight - vh;
      if (total <= 0) {
        setProgress(1);
        return;
      }
      const scrolled = Math.max(0, -rect.top);
      setProgress(Math.min(1, Math.max(0, scrolled / total)));
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ref]);

  return progress;
}

/**
 * Tracks the raw window.scrollY value, throttled via rAF.
 */
export function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      setScrollY(window.scrollY);
    };

    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return scrollY;
}
