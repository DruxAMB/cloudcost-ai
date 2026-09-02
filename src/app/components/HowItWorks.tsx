"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import { demo, demoVideoId } from "../content";

/**
 * Demo video section.
 *
 * Deliberately a *facade*: we render the poster frame and only mount the
 * YouTube iframe once the user clicks. A YouTube embed pulls roughly a
 * megabyte of player JS, and mounting it on page load will show up on the
 * hero's frame budget — which is the one performance number a judge feels
 * rather than reads.
 *
 * The poster is served by YouTube itself, so there is no image to commit.
 */
export default function HowItWorks() {
  const [playing, setPlaying] = useState(false);

  const poster = `https://i.ytimg.com/vi/${demoVideoId}/maxresdefault.jpg`;

  return (
    <section id="demo" className="flex h-full w-full items-center px-3 md:px-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <div className="grid overflow-hidden rounded-[24px] bg-ld-dark-2 lg:grid-cols-[minmax(0,440px)_1fr]">
            {/* Left: label + heading */}
            <div className="flex flex-col justify-start p-8 lg:p-10">
              <div className="mb-7 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-ld-lime">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8Z" stroke="#191919" strokeWidth="1.4" />
                    <circle cx="8" cy="8" r="1.9" fill="#191919" />
                  </svg>
                </span>
                <span className="text-[14px] text-white/85">{demo.eyebrow}</span>
              </div>

              <h2 className="text-4xl leading-[1.06] font-bold tracking-[-0.035em] text-white md:text-6xl">
                {demo.headline}
              </h2>
            </div>

            {/* Right: video surface */}
            <div className="relative min-h-[280px] bg-ld-dark-3 lg:min-h-[520px]">
              {playing ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${demoVideoId}?autoplay=1&rel=0`}
                  title={demo.headline}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <div className="absolute -top-16 left-1/3 h-80 w-80 rounded-full bg-ld-purple/20 blur-[110px]" />
                  <div className="absolute right-8 bottom-0 h-72 w-72 rounded-full bg-ld-blue/15 blur-[110px]" />

                  {/* Poster frame. Hidden on error so a bad/missing video id
                      degrades to the gradient rather than a broken image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={poster}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover opacity-55"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <button
                    onClick={() => setPlaying(true)}
                    aria-label={`Play demo video — ${demo.headline}`}
                    className="btn-fill !absolute inset-0 m-auto flex h-[74px] w-[74px] cursor-pointer items-center justify-center rounded-[90px] bg-ld-lime shadow-2xl transition-transform duration-300 hover:scale-105"
                    style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#7ffaa8" }}
                  >
                    <span className="btn-fill-label ml-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" className="text-ld-dark" aria-hidden>
                        <path d="M6 3.5 20 12 6 20.5Z" fill="currentColor" />
                      </svg>
                    </span>
                  </button>

                  <span className="absolute right-5 bottom-5 rounded-[6px] bg-black/50 px-2 py-1 font-mono text-[12px] text-white/70">
                    {demo.duration}
                  </span>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
