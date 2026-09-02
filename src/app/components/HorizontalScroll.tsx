"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Horizontal scroll wrapper.
 *
 * On desktop (≥640px): children become panels in a horizontal track.
 * Vertical scroll drives horizontal movement via GSAP ScrollTrigger +
 * CSS sticky (no pin spacer).
 *
 * On mobile (<640px): panels stack vertically and scroll normally.
 * The GSAP animation is disabled via gsap.matchMedia.
 */
export default function HorizontalScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const panels = Array.isArray(children) ? children : [children];
  const count = panels.length;

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const track = trackRef.current;
      if (!track) return;

      const mm = gsap.matchMedia();

      // Desktop: horizontal scroll
      mm.add("(min-width: 640px)", () => {
        const getDistance = () => track.scrollWidth - window.innerWidth;

        gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
      });

      return () => mm.revert();
    },
    { scope: wrapperRef }
  );

  if (isMobile) {
    // Mobile: stack panels vertically, normal scroll
    return (
      <div ref={wrapperRef} data-horizontal-scroll className="bg-ld-dark">
        {panels.map((panel, i) => (
          <div key={i} data-panel-index={i} className="min-h-screen flex items-center justify-center py-12">
            {panel}
          </div>
        ))}
      </div>
    );
  }

  // Desktop: horizontal track
  return (
    <div ref={wrapperRef} data-horizontal-scroll style={{ height: `${count * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-ld-dark">
        <div
          ref={trackRef}
          className="flex h-full"
          style={{ width: `${count * 100}vw` }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              data-panel-index={i}
              className="flex h-full w-screen shrink-0 items-center justify-center overflow-y-auto"
            >
              {panel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
