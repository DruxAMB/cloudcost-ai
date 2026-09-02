import Reveal from "./Reveal";
import { deepDive } from "../content";

/**
 * The two deep-dive panels — the highest-leverage real estate on the page,
 * because this is where a technical judge decides whether the hard part is
 * real.
 *
 *   variant="primary" — the novel mechanic behind your money shot.
 *   variant="sponsor" — the prize-track tech doing genuine work. Sponsor
 *                       prizes are scored on whether the integration is
 *                       load-bearing, so show what it *does*, not that you
 *                       imported it.
 */

type Variant = "primary" | "sponsor";

const config: Record<
  Variant,
  {
    title: string;
    accent: string;
    iconBg: string;
    sub: string;
    cta: string;
    href: string;
    features: string[];
  }
> = {
  primary: {
    title: deepDive.primary.title,
    accent: "#FF841F",
    iconBg: "linear-gradient(135deg,#FFB347 0%,#FF841F 50%,#FB3C4F 100%)",
    sub: deepDive.primary.sub,
    cta: deepDive.primary.cta,
    href: deepDive.primary.href,
    features: deepDive.primary.bullets,
  },
  sponsor: {
    title: deepDive.sponsor.title,
    accent: "#377FEA",
    iconBg: "linear-gradient(135deg,#618bff 0%,#377FEA 45%,#6937EA 100%)",
    sub: deepDive.sponsor.sub,
    cta: deepDive.sponsor.cta,
    href: deepDive.sponsor.href,
    features: deepDive.sponsor.bullets,
  },
};

export default function ControlSection({
  variant,
  reverse = false,
}: {
  variant: Variant;
  reverse?: boolean;
}) {
  const c = config[variant];

  const panel = (
    <div className="flex min-h-[480px] flex-col rounded-[24px] bg-ld-dark p-6 lg:p-8">
      <span
        className="mb-8 flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/15"
        style={{ background: c.iconBg }}
        aria-hidden
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 12h13" stroke="#191919" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 6.5 18.5 12 13 17.5" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h3 className="text-4xl leading-[1.06] font-bold tracking-[-0.035em] text-white md:text-6xl">
        {c.title}
      </h3>

      <p className="mt-auto pt-10 text-[14px] leading-[1.5] text-white/60">
        {c.sub}
      </p>

      <a
        href={c.href}
        target={c.href.startsWith("#") ? undefined : "_blank"}
        rel={c.href.startsWith("#") ? undefined : "noopener noreferrer"}
        className="btn-fill mt-5 inline-flex w-fit items-center gap-2 rounded-[8px] px-5 py-3 text-[15px] font-semibold text-ld-dark"
        style={{ backgroundColor: c.accent, ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#ffffff" }}
      >
        <span className="btn-fill-label flex items-center gap-2">
          {c.cta}
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
    </div>
  );

  const radii = [
    "rounded-tl-[8px] rounded-br-[8px] rounded-tr-[24px] rounded-bl-[24px]",
    "rounded-[24px]",
    "rounded-tl-[24px] rounded-br-[24px] rounded-tr-[4px] rounded-bl-[4px]",
    "rounded-tr-[8px] rounded-bl-[8px] rounded-tl-[24px] rounded-br-[24px]",
    "rounded-[4px]",
    "rounded-tl-[12px] rounded-br-[12px] rounded-tr-[24px] rounded-bl-[24px]",
    "rounded-t-[24px] rounded-b-[8px]",
    "rounded-l-[24px] rounded-r-[4px]",
    "rounded-tl-[4px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px]",
    "rounded-[24px]",
    "rounded-tl-[24px] rounded-br-[4px] rounded-tr-[12px] rounded-bl-[12px]",
    "rounded-t-[8px] rounded-b-[24px]",
    "rounded-r-[24px] rounded-l-[8px]",
    "rounded-tl-[8px] rounded-br-[24px] rounded-tr-[24px] rounded-bl-[4px]",
    "rounded-[12px]",
    "rounded-tl-[24px] rounded-br-[24px] rounded-tr-[4px] rounded-bl-[4px]",
  ];

  const pills = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {c.features.map((f, i) => (
        <Reveal key={i} delay={i * 24}>
          <div className={`flex items-center justify-center border bg-white px-4 py-3 text-center text-[13px] text-ld-dark transition-colors hover:border-ld-dark hover:bg-[#f1f1f4] ${radii[i % radii.length]}`}>
            {f}
          </div>
        </Reveal>
      ))}
    </div>
  );

  return (
    <section className="flex h-full w-full items-center px-3 md:px-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="rounded-[40px] bg-[#f8f8f8] p-5 lg:p-12">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
            {reverse ? (
              <>
                <div className="order-2 lg:order-1">{pills}</div>
                <div className="order-1 lg:order-2">{panel}</div>
              </>
            ) : (
              <>
                <div>{panel}</div>
                <div>{pills}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
