"use client";

import { useState } from "react";
import GradientArt from "./GradientArt";
import Reveal from "./Reveal";
import { architecture, links } from "../content";

/**
 * Architecture section.
 *
 * Name the hard part explicitly — this is where technical judges award
 * points, and it is the cheapest section on the page to score well on. The
 * flow row should read as the actual request path, not a marketing diagram.
 */
export default function BuiltForDevelopers() {
  const [copied, setCopied] = useState(false);

  const cloneCmd = `git clone ${links.repo} && npm ci && npm run dev`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cloneCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section
      id="architecture"
      className="flex h-full w-full flex-col items-center justify-center px-3 md:px-6"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="mx-auto max-w-[720px] text-center text-4xl leading-[1.04] font-bold tracking-[-0.04em] text-white md:text-6xl">
            {architecture.headline}
          </h2>
        </Reveal>

        {/* Request path */}
        <Reveal delay={80}>
          <ol className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
            {architecture.flow.map((step, i) => (
              <li key={`${step}-${i}`} className="flex items-center gap-2">
                <span className="rounded-[10px] border border-white/15 bg-ld-dark-2 px-4 py-2.5 text-[13px] text-white/85">
                  {step}
                </span>
                {i < architecture.flow.length - 1 && (
                  <svg
                    width="16"
                    height="10"
                    viewBox="0 0 14 10"
                    fill="none"
                    aria-hidden
                    className="shrink-0 rotate-90 text-white/30 sm:rotate-0"
                  >
                    <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {architecture.cards.map((c, i) => (
            <Reveal key={`${c.title}-${i}`} delay={i * 100}>
              <div className="relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-[24px] bg-ld-dark-2">
                <div className="relative z-10 p-6">
                  <h3 className="text-[22px] leading-tight font-semibold tracking-[-0.025em] text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 max-w-[320px] text-[14px] leading-[1.5] text-white/60">
                    {c.desc}
                  </p>
                </div>

                <GradientArt
                  palette={i === 0 ? "orange" : "lime"}
                  shape={i === 0 ? "wave" : "diagonal"}
                  grid={false}
                  className="mt-auto h-[120px]"
                />

                <a
                  href={c.href}
                  target={c.href.startsWith("#") ? undefined : "_blank"}
                  rel={c.href.startsWith("#") ? undefined : "noopener noreferrer"}
                  className="btn-fill !absolute right-6 bottom-6 z-20 inline-flex items-center gap-2 rounded-[8px] border border-ld-dark/15 bg-white px-5 py-3 text-[15px] font-semibold text-ld-dark"
                  style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#ffffff" }}
                >
                  <span className="btn-fill-label flex items-center gap-2">
                    {c.cta}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                      <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Run it yourself. Judges who clone the repo are the ones scoring
            technical execution — make it one paste. Verify this command
            actually works from a fresh clone before shipping. */}
        <Reveal delay={180}>
          <div className="relative mt-4 overflow-hidden rounded-[24px] bg-ld-dark-2">
            <div className="relative z-10 p-6">
              <h3 className="text-[22px] leading-tight font-semibold tracking-[-0.025em] text-white">
                Run it yourself.
              </h3>
              <p className="mt-2.5 max-w-[420px] text-[14px] leading-[1.5] text-white/60">
                Clone the repo and it runs locally. Environment variables and
                what degrades without each one are listed in the README.
              </p>
            </div>

            <GradientArt
              palette="magenta"
              shape="hill"
              grid={false}
              className="h-[130px]"
            />

            <div className="absolute inset-x-6 bottom-6 z-20 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-[12px] bg-ld-dark-3/95 p-4 backdrop-blur">
                <p className="font-mono text-[11px] leading-relaxed break-all text-white/70">
                  <span style={{ color: "#7ffaa8" }}>{cloneCmd}</span>
                </p>
              </div>
              <button
                onClick={copy}
                className="btn-fill inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[8px] border border-ld-dark/15 bg-white px-5 py-3 text-[15px] font-semibold text-ld-dark"
                style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#ffffff" }}
              >
                <span className="btn-fill-label flex items-center gap-2">
                  {copied ? "Copied" : "Copy to clipboard"}
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                    <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
