"use client";

import { useEffect } from "react";
import { useLenis } from "../lib/lenis-context";

/**
 * Drives `#demo` and `#architecture` anchor links to the exact panel inside
 * the horizontal scroll track, instead of letting the browser jump to the
 * track wrapper.
 *
 * Why this exists: those two ids live on sections that are children of the
 * `HorizontalScroll` track. A native anchor jump lands on the track's start
 * (panel 0), not on the panel the user asked for. The track's horizontal
 * position is driven by vertical scroll via GSAP ScrollTrigger, so to reach
 * panel N we scroll to `wrapperTop + N * innerHeight` — see the derivation in
 * TEMPLATE.md.
 *
 * On mobile the track stacks vertically, so the native anchor jump already
 * works and this handler is a no-op (the target element is not inside a
 * `[data-horizontal-scroll]` desktop track).
 */
const PANEL_ANCHORS = new Set(["#demo", "#architecture"]);

export default function PanelNav() {
  const lenis = useLenis();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href^='#']");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !PANEL_ANCHORS.has(href)) return;

      const sectionEl = document.getElementById(href.slice(1));
      if (!sectionEl) return;

      // Only intercept if the section is inside the desktop horizontal track.
      const wrapper = sectionEl.closest<HTMLElement>("[data-horizontal-scroll]");
      if (!wrapper) return;

      const panel = sectionEl.closest<HTMLElement>("[data-panel-index]");
      if (!panel) return;

      const index = Number(panel.dataset.panelIndex);
      if (Number.isNaN(index)) return;

      e.preventDefault();

      // Target scroll: wrapperTop + index * viewportHeight.
      // Derived from: progress = N/(count-1), scrollDistance = (count-1)*vh,
      // so scrollY = wrapperTop + N*vh.
      const wrapperTop =
        wrapper.getBoundingClientRect().top + window.scrollY;
      const targetY = wrapperTop + index * window.innerHeight;

      if (lenis) {
        lenis.scrollTo(targetY, { duration: 1.2 });
      } else {
        // Reduced-motion path: Lenis is absent, jump instantly.
        window.scrollTo({ top: targetY, behavior: "auto" });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}
