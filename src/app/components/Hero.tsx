"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";
import { HeroWidgetRenderer } from "./HeroWidgets";
import { hero, heroWidgets } from "../content";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // 1. Headline: SplitText + bounce-in per char with random delay
      if (headlineRef.current) {
        const chars = SplitText.create(headlineRef.current, { type: "chars" });
        chars.chars.forEach((ch) => {
          gsap.from(ch, {
            y: -200,
            opacity: 0,
            duration: 0.8,
            ease: "bounce.out",
            delay: Math.random() * 0.5,
          });
        });
      }

      // 2. Subtext: scramble text effect — starts after headline finishes
      // Headline: max delay 0.5s + duration 0.8s = 1.3s
      // ScrambleTextPlugin only works with plain text, so we scramble
      // the textContent, then restore the styled innerHTML (with blue
      // spans) when the scramble completes.
      if (subtextRef.current) {
        const styledHTML = subtextRef.current.innerHTML;
        const plainText = subtextRef.current.textContent || "";
        gsap.fromTo(
          subtextRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.3,
            delay: 1.4,
            onStart: () => {
              gsap.to(subtextRef.current, {
                scrambleText: {
                  text: plainText,
                  chars: "ﾊﾐﾋｰｳｼﾅﾓﾆｻ012345789",
                  speed: 0.3,
                },
                duration: 2.5,
                onComplete: () => {
                  // Restore styled HTML with blue spans
                  subtextRef.current!.innerHTML = styledHTML;
                },
              });
            },
          }
        );
      }

      // 3. Hero fade on scroll
      const wrapper = document.querySelector(".hero-wrapper");
      if (wrapper) {
        gsap.to(sectionRef.current, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: "20% top",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="hero-content sticky top-0 z-0 relative mx-auto flex min-h-screen max-w-[1400px] flex-col overflow-hidden bg-black text-white">
      {/* grid backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />

      {/* ---------------- Centered copy ---------------- */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pt-20 text-center md:px-6">
        <h1
          ref={headlineRef}
          className="mx-auto max-w-[900px] text-4xl leading-[0.98] font-bold tracking-[-0.045em] sm:text-6xl lg:text-8xl"
        >
          {hero.headlineTop}
          <br />
          {hero.headlineBottom}
        </h1>

        <p
          ref={subtextRef}
          className="mx-auto mt-7 max-w-[620px] text-[15px] leading-[1.6] text-white/70"
          style={{ opacity: 0 }}
        >
          {hero.sub.lead}{" "}
          <span className="text-ld-blue">{hero.sub.accentOne}</span>{" "}
          {hero.sub.middle}{" "}
          <span className="text-ld-blue">{hero.sub.accentTwo}</span>{" "}
          {hero.sub.tail}
        </p>

        {/* Primary CTA goes straight into the tool — no email gate, no signup.
            A judge on a 3-minute clock will not fill in a form. */}
        <div
          className="widget-enter mx-auto mt-9 flex flex-col items-center gap-3 sm:flex-row"
          style={
            {
              ["--entry-y" as string]: "20px",
              ["--entry-x" as string]: "0px",
              ["--entry-delay" as string]: "0.24s",
            } as React.CSSProperties
          }
        >
          <a
            href={hero.primaryCta.href}
            className="btn-fill inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[8px] bg-ld-lime px-6 py-3 text-[15px] font-semibold whitespace-nowrap text-ld-dark"
            style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#7ffaa8" }}
          >
            <span className="btn-fill-label flex items-center gap-2">
              {hero.primaryCta.label}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>

          <a
            href={hero.secondaryCta.href}
            className="btn-fill inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border border-white/25 px-6 py-3 text-[15px] font-semibold whitespace-nowrap text-white"
            style={{ ["--fill-bg" as string]: "#ffffff", ["--fill-text" as string]: "#191919" }}
          >
            <span className="btn-fill-label flex items-center gap-2">
              <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden>
                <path d="M3 2.5 11 7l-8 4.5Z" fill="currentColor" />
              </svg>
              {hero.secondaryCta.label}
            </span>
          </a>
        </div>
      </div>

      {/* ---------------- Bottom widget band ----------------
          Desktop: clipped overflow (widgets bleed past edges).
          Mobile: horizontally scrollable with snap.
          Widgets are data-driven from `heroWidgets` in content.ts. */}
      <div className="relative h-[320px] overflow-x-auto overflow-y-hidden snap-x snap-mandatory sm:overflow-hidden lg:h-[340px] no-scrollbar">
        <div className="absolute inset-x-0 top-0 flex items-start gap-6 px-4 md:px-6">
          {/* slight left bleed so the row reads as continuing past the edge */}
          <div className="flex shrink-0 items-start gap-6 sm:[margin-left:-60px]" style={{ marginLeft: "0px" }}>
            {heroWidgets.map((item, i) => (
              <HeroWidgetRenderer key={i} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
