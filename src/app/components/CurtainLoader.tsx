"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Full-page curtain loader.
 * Two white panels slide apart on load, then the hero content scales in.
 *
 * Key GSAP patterns:
 * - gsap.set() before the timeline to avoid FOUC (Flash of Unstyled Content).
 *   useGSAP runs as useLayoutEffect, so set() applies before paint.
 * - Curtains are a visible color (white) so they're actually seen.
 * - Only the hero content is scaled, not the entire page (which would
 *   break sticky positioning and ScrollTrigger calculations).
 */
export default function CurtainLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDone(true);
        return;
      }

      // Set initial state BEFORE the timeline to prevent FOUC.
      // useGSAP runs as useLayoutEffect (before paint), so this is safe.
      // Scope is rootRef — only the curtain panels are inside it.
      // The hero content has its own entrance animation in Hero.tsx
      // (SplitText + scramble). Do NOT animate .hero-content here —
      // it would conflict with Hero's ScrollTrigger opacity scrub.
      gsap.set(".curtain-left", { xPercent: 0 });
      gsap.set(".curtain-right", { xPercent: 0 });

      const tl = gsap.timeline({
        onComplete: () => setDone(true),
      });

      tl.to(".curtain-left", { xPercent: -100, duration: 1, ease: "power3.inOut" }, 0)
        .to(".curtain-right", { xPercent: 100, duration: 1, ease: "power3.inOut" }, 0);
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef}>
      {/* Curtains — white panels that slide apart.
          Fixed positioning covers the full viewport.
          pointer-events-none so they never block interaction. */}
      {!done && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="curtain-left absolute inset-y-0 left-0 w-1/2 bg-white" />
          <div className="curtain-right absolute inset-y-0 right-0 w-1/2 bg-white" />
        </div>
      )}
    </div>
  );
}
