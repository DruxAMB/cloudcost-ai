import { techStack } from "../content";

/**
 * "Built with" strip — the stack this project actually uses, sponsor and
 * prize-track tech first.
 *
 * This deliberately is NOT a "trusted by" customer wall. You have no
 * customers, and borrowing someone else's would be the fastest way to lose
 * an event. What you *did* build with is real, verifiable, and is exactly
 * what a judge scanning for their sponsor track is looking for.
 *
 * Wordmarks are set in type rather than reproducing third-party logo
 * artwork. If you swap in real brand assets, check each vendor's brand
 * guidelines first: "built with X" is normally permitted, anything implying
 * partnership or endorsement is not.
 */

/** Shape variation, applied per position so the row stays visually varied. */
const shapes = [
  { cls: "font-semibold tracking-[0.12em] text-[15px]", radius: "rounded-tl-[12px] rounded-br-[12px] rounded-tr-[90px] rounded-bl-[90px]" },
  { cls: "font-semibold tracking-[-0.01em] text-[17px]", radius: "rounded-[90px]" },
  { cls: "font-semibold tracking-[0.02em] text-[17px]", radius: "rounded-tl-[90px] rounded-br-[90px] rounded-tr-[4px] rounded-bl-[4px]" },
  { cls: "font-semibold tracking-[0.22em] text-[15px]", radius: "rounded-tr-[12px] rounded-bl-[12px] rounded-tl-[90px] rounded-br-[90px]" },
  { cls: "font-semibold tracking-[0.04em] text-[18px]", radius: "rounded-[4px]" },
  { cls: "font-normal tracking-[0.3em] text-[16px]", radius: "rounded-tl-[20px] rounded-br-[20px] rounded-tr-[90px] rounded-bl-[90px]" },
  { cls: "font-normal tracking-[-0.01em] text-[15px]", radius: "rounded-t-[90px] rounded-b-[12px]" },
  { cls: "font-semibold tracking-[0.14em] text-[16px]", radius: "rounded-l-[90px] rounded-r-[4px]" },
];

export default function LogoMarquee() {
  const logos = techStack.map((t, i) => ({ ...t, ...shapes[i % shapes.length] }));
  const row = [...logos, ...logos];

  return (
    <section className="relative z-10 bg-ld-dark py-8 md:py-10">
      <div className="marquee-pause relative overflow-hidden">
        <div className="flex w-max gap-4 animate-marquee">
          {row.map((l, i) => (
            <div
              key={`${l.name}-${i}`}
              className={`flex h-[94px] w-[206px] shrink-0 flex-col items-center justify-center gap-1 bg-white px-6 select-none ${l.radius}`}
            >
              <span className={`text-ld-dark whitespace-nowrap ${l.cls}`}>
                {l.name}
              </span>
              {/* Prize-track tech gets a marker so a judge scanning for their
                  sponsor finds it without reading the whole row. */}
              {l.sponsor && (
                <span className="text-[10px] font-semibold tracking-[0.14em] text-ld-dark/45 uppercase">
                  Prize track
                </span>
              )}
            </div>
          ))}
        </div>

        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-ld-dark to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-ld-dark to-transparent" />
      </div>
    </section>
  );
}
