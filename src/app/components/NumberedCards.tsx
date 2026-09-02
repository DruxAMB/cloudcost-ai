"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import GradientArt, { Sparkle } from "./GradientArt";
import { featureCards, headerCta } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Palette = "lime" | "blue" | "orange" | "pink" | "yellow";

const swatch: Record<Palette, string> = {
  lime: "#7ffaa8",
  blue: "#377FEA",
  orange: "#FF841F",
  pink: "#FB3C4F",
  yellow: "#ebc346",
};

function Glyph({ kind }: { kind: number }) {
  const common = { stroke: "#191919", strokeWidth: 1.6, fill: "none" as const };
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      {kind === 0 && <circle cx="8" cy="8" r="3.2" fill="#191919" />}
      {kind === 1 && (
        <path d="M8 1.5 9.7 6l4.8.3-3.6 3.1 1.1 4.6L8 11.6 4 14l1.1-4.6L1.5 6.3 6.3 6Z" fill="#191919" />
      )}
      {kind === 2 && <path d="M8 2.5 14 13H2Z" fill="#191919" />}
      {kind === 3 && (
        <path d="M8 1.5v13M2 8h12M3.5 3.5l9 9M12.5 3.5l-9 9" {...common} strokeLinecap="round" />
      )}
      {kind === 4 && <path d="M8 1.8 13.6 5v6L8 14.2 2.4 11V5Z" fill="#191919" />}
    </svg>
  );
}

const items: {
  num: string;
  title: string;
  desc: string;
  palette: Palette;
  overlay: "rollout" | "models" | "evals";
}[] = featureCards.map((c, i) => ({
  num: String(i + 1).padStart(2, "0"),
  title: c.title,
  desc: c.desc,
  palette: (["lime", "blue", "orange", "pink", "yellow"] as const)[i % 5],
  overlay: (["rollout", "evals", "models"] as const)[i % 3],
}));

/** Small dark widget card floated over the gradient art. */
function Overlay({ kind }: { kind: "rollout" | "models" | "evals" }) {
  if (kind === "rollout") {
    return (
      <div className="w-[248px] rounded-[14px] bg-ld-dark-2/95 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 text-[14px] text-white">Rollout duration</div>
        {[
          ["5%", "6"],
          ["25%", "12"],
        ].map(([pct, n]) => (
          <div key={pct} className="mb-2 flex items-center gap-2 text-[11px] last:mb-0">
            <span className="rounded-[6px] bg-white/10 px-2.5 py-1.5 text-white/80">{pct}</span>
            <span className="text-white/45">for</span>
            <span className="rounded-[6px] bg-white/10 px-2.5 py-1.5 text-white/80">{n}</span>
            <span className="flex-1 rounded-[6px] bg-white/10 px-2 py-1.5 text-white/60">hours</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "models") {
    return (
      <div className="w-[248px] rounded-[14px] bg-ld-dark-2/95 p-4 shadow-2xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] text-white">Model Distribution</span>
          <span className="rounded-[5px] bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/45">
            last 7d
          </span>
        </div>
        {[
          ["GPT-5.5", 62],
          ["Claude Sonnet 4.6", 45],
          ["Claude Opus 4.7", 10],
        ].map(([label, v]) => (
          <div key={label as string} className="mb-2.5 last:mb-0">
            <div className="mb-1 flex justify-between font-mono text-[10px]">
              <span className="text-white/55">{label}</span>
              <span className="text-white/75">{v}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-[90px] bg-white/10">
              <div className="h-full rounded-[90px] bg-white" style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[248px] rounded-[14px] bg-ld-dark-2/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 text-[14px] text-white">Online evals</div>
      {[
        ["toxicity", "pass"],
        ["groundedness", "pass"],
        ["pii-leak", "blocked"],
      ].map(([k, v]) => (
        <div key={k} className="mb-2 flex items-center justify-between text-[11px] last:mb-0">
          <span className="font-mono text-white/65">{k}</span>
          <span
            className="rounded-[90px] px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: v === "pass" ? "rgba(60,185,54,0.18)" : "rgba(251,60,79,0.18)",
              color: v === "pass" ? "#3CB936" : "#FB3C4F",
            }}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NumberedCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // All 5 open by default; scroll closes 1-4, #5 stays open
  const [openStates, setOpenStates] = useState<boolean[]>([true, true, true, true, true]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const panels = gsap.utils.toArray<HTMLElement>(".acc-panel").slice(0, 4);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const next = [
              p < 0.25,
              p < 0.5,
              p < 0.75,
              p < 1.0,
              true,
            ];
            setOpenStates((prev) => {
              if (prev.every((v, i) => v === next[i])) return prev;
              return next;
            });
          },
        },
      });

      panels.forEach((panel, i) => {
        tl.to(
          panel,
          {
            height: 0,
            autoAlpha: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          i
        );
      });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    },
    { scope: sectionRef }
  );

  return (
    /* Outer wrapper provides the scroll distance (300vh).
       Inner section is CSS sticky — no GSAP pin spacer needed. */
    <div ref={sectionRef} className="relative z-10" style={{ height: "300vh" }}>
    <section className="sticky top-0 flex min-h-screen items-center bg-ld-dark px-3 md:px-6">
      <div className="mx-auto max-w-[1400px] w-full">
        <div className="grid gap-10 rounded-[40px] bg-[#f8f8f8] px-5 py-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16 lg:px-14 lg:py-16">
          {/* Left: heading + number tabs */}
          <div>
            <h2 className="max-w-[420px] text-4xl leading-[1.02] font-bold tracking-[-0.035em] text-ld-dark md:text-6xl">
              Control every change in production.
            </h2>

            <div className="mt-7 flex items-center gap-2">
              {items.map((it, i) => (
                <div
                  key={it.num}
                  aria-label={`Step ${it.num}`}
                  className="rounded-[8px] border px-3 py-2 font-mono text-[13px] transition-colors duration-300"
                  style={{
                    backgroundColor: openStates[i] ? swatch[it.palette] : "#ffffff",
                    borderColor: openStates[i] ? "#191919" : "rgba(25,25,25,0.2)",
                    color: "#191919",
                  }}
                >
                  {it.num}
                </div>
              ))}
            </div>
          </div>

          {/* Right: accordion — all open by default, scroll closes 1-4 */}
          <div className="min-w-0">
            {items.map((it, i) => (
              <div key={it.num} className="border-t border-ld-dark/12 last:border-b">
                {/* Header row — always visible */}
                <div className="flex w-full items-center gap-3.5 py-5 text-left">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-ld-dark"
                    style={{ backgroundColor: swatch[it.palette] }}
                  >
                    <Glyph kind={i} />
                  </span>
                  <span className="text-lg leading-tight font-semibold tracking-[-0.02em] text-ld-dark md:text-2xl">
                    {it.title}
                  </span>
                </div>

                {/* Content panel — GSAP animates height + opacity.
                    overflow-hidden clips content as it collapses. */}
                <div className="acc-panel overflow-hidden">
                  <div className="grid gap-5 pb-7 sm:grid-cols-[minmax(0,300px)_1fr]">
                    <div>
                      <p className="text-[14px] leading-[1.55] text-[#58595b]">
                        {it.desc}
                      </p>
                      {/* Points into the tool rather than a "learn more" page
                          that does not exist. */}
                      <a
                        href={headerCta.href}
                        className="btn-fill mt-5 inline-flex items-center gap-2 rounded-[8px] border bg-white px-4 py-3 text-[14px] font-semibold text-ld-dark"
                        style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#ffffff" }}
                      >
                        <span className="btn-fill-label flex items-center gap-2">
                          {headerCta.label}
                          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                            <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </a>
                    </div>

                    <GradientArt
                      palette={it.palette}
                      shape="block"
                      className="relative min-h-[300px] w-full rounded-[16px]"
                    >
                      <Sparkle
                        size={38}
                        className="absolute top-4 right-8 drop-shadow"
                      />
                      <div className="absolute right-4 bottom-4">
                        <Overlay kind={it.overlay} />
                      </div>
                    </GradientArt>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
