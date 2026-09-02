import GradientArt from "./GradientArt";
import { ctaCards, closingPhrase } from "../content";

/**
 * Closing CTA. The four cards are the submission artifacts — everything a
 * judge needs to dig in, each a real URL. The source design used these for
 * "Get a demo / Free trial", which a hackathon project does not have.
 */

const art = [
  { icon: "#7ffaa8", palette: "lime" as const, shape: "diagonal" as const },
  { icon: "#6937EA", palette: "blue" as const, shape: "arc" as const },
  { icon: "#FF841F", palette: "orange" as const, shape: "hill" as const },
  { icon: "#377FEA", palette: "cyan" as const, shape: "arc" as const },
];

const cards = ctaCards.map((c, i) => ({ ...c, ...art[i % art.length] }));

export default function CTA() {
  const phrase = closingPhrase;

  return (
    <section className="lime-field relative overflow-hidden pt-28 pb-10">
      {/* Oversized scrolling headline */}
      <div className="marquee-pause relative overflow-hidden">
        <div className="flex w-max items-center gap-8 animate-marquee-fast">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <span className="text-6xl leading-none font-bold tracking-[-0.04em] whitespace-nowrap text-ld-dark md:text-7xl">
                {phrase}
              </span>
              <svg width="34" height="34" viewBox="0 0 40 40" className="shrink-0" aria-hidden>
                <path
                  d="M20 0c1.4 10.6 8 17.2 20 18.6v2.8C28 22.8 21.4 29.4 20 40c-1.4-10.6-8-17.2-20-18.6v-2.8C12 17.2 18.6 10.6 20 0Z"
                  fill="#191919"
                />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow + action cards */}
      <div className="mx-auto mt-12 max-w-[1400px] px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch">
          <svg
            width="150"
            height="70"
            viewBox="0 0 150 70"
            className="hidden shrink-0 self-center lg:block"
            aria-hidden
          >
            <path d="M0 35h122" stroke="#191919" strokeWidth="7" strokeLinecap="round" />
            <path d="M104 12l38 23-38 23" stroke="#191919" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>

          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("#") ? undefined : "_blank"}
                rel={c.href.startsWith("#") ? undefined : "noopener noreferrer"}
                className="group relative flex h-[150px] flex-col overflow-hidden rounded-[16px] bg-ld-dark transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative z-10 flex items-start justify-between p-4">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-[90px]"
                    style={{ backgroundColor: c.icon }}
                  >
                    <svg width="13" height="9" viewBox="0 0 14 10" fill="none" aria-hidden>
                      <path d="M1 5h11M8 1l4 4-4 4" stroke="#191919" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
                    {c.label}
                  </span>
                </div>

                <GradientArt
                  palette={c.palette}
                  shape={c.shape}
                  grid={false}
                  className="mt-auto h-[88px]"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
