"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import GradientArt from "./GradientArt";
import Reveal from "./Reveal";
import { resources as resourceContent } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Decorative art assigned per position; content comes from content.ts. */
const art = [
  { palette: "orange" as const, shape: "hill" as const },
  { palette: "blue" as const, shape: "diagonal" as const },
  { palette: "lime" as const, shape: "arc" as const },
  { palette: "magenta" as const, shape: "arc" as const },
];

const resources = resourceContent.map((r, i) => ({ ...r, ...art[i % art.length] }));

export default function Resources() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const track = trackRef.current;
      if (!track) return;

      // Only apply horizontal scroll on larger screens where cards
      // are wider than the viewport when laid out in a row.
      const mm = gsap.matchMedia();

      mm.add("(min-width: 640px)", () => {
        const getDistance = () => track.scrollWidth - window.innerWidth + 96;

        // Start the track off-screen to the right, then animate to x:0
        // so cards scroll IN from right-to-left as you scroll down.
        gsap.fromTo(
          track,
          { x: () => getDistance() },
          {
            x: 0,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              end: "top 30%",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          }
        );

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="bg-ld-dark px-3 pb-10 md:px-6 md:pb-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="rounded-[40px] bg-ld-dark-2 px-5 py-12 lg:px-12 lg:py-14">
          <Reveal>
            <h2 className="mb-10 text-[30px] leading-[1.05] font-bold tracking-[-0.035em] text-white md:text-[38px]">
              Resources to get started.
            </h2>
            {/* Point these at the docs for the tech you integrated —
                especially sponsor tracks. Doubles as integration evidence. */}
          </Reveal>

          {/* Horizontal scroll track — cards slide in from right as you
              scroll down. On mobile (<640px) falls back to a vertical stack. */}
          <div className="overflow-hidden sm:overflow-visible">
            <div
              ref={trackRef}
              className="flex gap-5 will-change-transform flex-col sm:flex-row sm:flex-nowrap"
            >
              {resources.map((r, i) => (
                <Reveal key={r.tag} delay={i * 90}>
                  <a
                    href={r.href}
                    target={r.href.startsWith("#") ? undefined : "_blank"}
                    rel={r.href.startsWith("#") ? undefined : "noopener noreferrer"}
                    className="group flex h-full w-full shrink-0 flex-col sm:w-[340px] lg:w-[300px]"
                  >
                    {/* Decorative art with corner action */}
                    <div className="relative">
                      <GradientArt
                        palette={r.palette}
                        shape={r.shape}
                        grid={false}
                        className="h-[204px] rounded-[14px]"
                      />
                      <span className="absolute right-0 bottom-0 flex h-9 w-14 items-center justify-center rounded-tl-[12px] rounded-br-[12px] bg-ld-dark-2 text-white transition-transform duration-300 group-hover:translate-x-0.5">
                        <svg width="15" height="11" viewBox="0 0 14 10" fill="none" aria-hidden>
                          <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>

                    <h3 className="mt-5 text-[18px] leading-tight font-semibold tracking-[-0.02em] text-white">
                      {r.title}
                    </h3>
                    <div className="mt-1.5 text-[13px] text-white/45">{r.tag}</div>
                    <p className="mt-2.5 text-[13px] leading-[1.5] text-white/60">
                      {r.desc}
                    </p>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
