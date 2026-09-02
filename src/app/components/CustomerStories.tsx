"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import GradientArt from "./GradientArt";
import { proof, proofNote } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Proof section.
 *
 * This slot held customer testimonials in the source design. A hackathon
 * project has no customers, so it now shows things that are actually true:
 * real output, measured numbers, cited evidence of the problem, and an
 * honest scope breakdown. See `proof` in content.ts for what belongs here.
 *
 * Do not reintroduce quotes from people who have not used this. A mock
 * testimonial with a disclaimer underneath is still a mock testimonial â€” the
 * reader takes in the quote and skips the caveat.
 */

const palettes = ["orange", "blue", "pink", "cyan", "lime"] as const;

const stories = proof.map((p, i) => ({
  ...p,
  palette: palettes[i % palettes.length],
  cls: "tracking-[0.02em] text-[15px] font-semibold",
}));

export default function CustomerStories() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [i, setI] = useState(0);
  const s = stories[i];

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(
            stories.length - 1,
            Math.floor(self.progress * stories.length)
          );
          setI((prev) => (prev === idx ? prev : idx));
        },
      });
      stRef.current = trigger;

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    },
    { scope: sectionRef }
  );

  // Manual nav: scroll to the target story's position
  const goTo = (idx: number) => {
    const st = stRef.current;
    if (!st) return;
    const clamped = ((idx % stories.length) + stories.length) % stories.length;
    const targetProgress = clamped / stories.length + 0.001;
    const scrollPos = st.start + targetProgress * (st.end - st.start);
    window.scrollTo({ top: scrollPos, behavior: "smooth" });
  };
  const move = (d: number) => goTo(i + d);

  return (
    /* Outer wrapper provides scroll distance (500vh = 100vh per story
       transition + 1 viewport for the initial view). Inner section is
       CSS sticky â€” no GSAP pin spacer. */
    <div ref={sectionRef} style={{ height: "500vh" }}>
    <section className="sticky top-0 flex min-h-screen items-center bg-ld-dark px-3 py-10 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,240px)_1fr]">
          {/* Left: vertical logo pill column */}
          <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible no-scrollbar">
            {stories.map((st, idx) => (
              <button
                key={st.label}
                onClick={() => goTo(idx)}
                className="flex h-[76px] sm:h-[94px] min-w-[150px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[24px] px-4 transition-colors duration-300 lg:min-w-0 lg:w-full"
                style={{
                  backgroundColor: idx === i ? "#7ffaa8" : "#ffffff",
                }}
              >
                <span className="text-[10px] font-semibold tracking-[0.14em] text-ld-dark/45 uppercase">
                  {st.kind}
                </span>
                <span className={`text-ld-dark whitespace-nowrap ${st.cls}`}>
                  {st.label}
                </span>
              </button>
            ))}
          </div>

          {/* Right: white panels */}
          <div className="min-w-0 space-y-4">
            <div className="rounded-[24px] bg-white px-8 py-8 sm:pt-12 sm:pb-24">
              <div className="mb-6 h-px w-full bg-ld-dark/12" />
              <h2
                key={i}
                className="fade-up max-w-[620px] text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ld-dark md:text-4xl"
              >
                {s.headline}
              </h2>
            </div>

            <div className="rounded-[24px] bg-white p-8 ">
              <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,440px)]">
                <div className="flex min-w-0 flex-col">
                  <span className="mb-5 inline-flex w-fit items-center rounded-[8px] bg-ld-dark px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
                    {s.kind}
                  </span>

                  <p key={i} className="fade-up text-[16px] leading-[1.55] text-[#414042]">
                    {s.body}
                  </p>

                  <div className="mt-7 grid gap-6 border-t border-ld-dark/12 pt-5 sm:grid-cols-2">
                    <div className="text-[12px] leading-[1.5] text-[#58595b]">
                      {s.source ? (
                        <a
                          href={s.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-ld-dark underline underline-offset-2"
                        >
                          Source
                        </a>
                      ) : (
                        <span className="font-semibold text-ld-dark">
                          Measured on this build
                        </span>
                      )}
                    </div>
                    {s.statValue && (
                      <div>
                        <div className="text-[12px] text-[#58595b]">{s.statLabel}</div>
                        <div className="mt-1 text-[30px] leading-none font-bold tracking-[-0.03em] text-ld-dark">
                          {s.statValue}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop: arrows pinned to bottom of left column */}
                  <div className="mt-auto hidden gap-2 bg-ld-dark text-white rounded-[8px] p-1 w-fit lg:flex">
                    {[-1, 1].map((d) => (
                      <button
                        key={d}
                        onClick={() => move(d)}
                        aria-label={d < 0 ? "Previous item" : "Next item"}
                        className="btn-fill flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-white text-white"
                        style={{ ["--fill-bg" as string]: "#ffffff", ["--fill-text" as string]: "#191919" }}
                      >
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden style={{ transform: d < 0 ? "rotate(180deg)" : undefined }}>
                          <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decorative case-study visual */}
                <div className="relative">
                  <GradientArt
                    key={i}
                    palette={s.palette}
                    shape="arc"
                    grid={false}
                    className="h-[230px] rounded-[16px] lg:h-full lg:min-h-[460px]"
                  />
                  {s.source && (
                    <a
                      href={s.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-fill !absolute right-0 bottom-0 inline-flex items-center gap-2 rounded-tl-[8px] rounded-br-[8px] bg-white px-4 py-2.5 text-[14px] font-semibold text-ld-dark shadow-lg"
                      style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#ffffff" }}
                    >
                      <span className="btn-fill-label flex items-center gap-2">
                        View source
                        <svg width="13" height="9" viewBox="0 0 14 10" fill="none" aria-hidden>
                          <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Mobile: arrows below the grid (under the image) */}
              <div className="mt-6 flex gap-2 bg-ld-dark text-white rounded-[8px] p-1 w-fit lg:hidden">
                {[-1, 1].map((d) => (
                  <button
                    key={d}
                    onClick={() => move(d)}
                    aria-label={d < 0 ? "Previous item" : "Next item"}
                    className="btn-fill flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-white text-white"
                    style={{ ["--fill-bg" as string]: "#ffffff", ["--fill-text" as string]: "#191919" }}
                  >
                    <span className="btn-fill-label">
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden style={{ transform: d < 0 ? "rotate(180deg)" : undefined }}>
                        <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Honest disclosure. This is a feature, not an apology â€” saying
                plainly that there are no users yet reads as confidence, and
                it is the thing that makes the numbers above believable. */}
            <p className="px-2 text-[12px] leading-[1.5] text-white/45">
              {proofNote}
            </p>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
