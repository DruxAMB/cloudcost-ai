import GradientArt, { Sparkle } from "./GradientArt";
import Reveal from "./Reveal";
import { statement } from "../content";

export default function ShipWithAI() {
  return (
    <section className="flex h-full w-full flex-col items-center justify-center px-3 text-center md:px-6">
      <div className="mx-auto max-w-[1400px] w-full">
        <Reveal>
          <span className="inline-flex items-center rounded-tl-[14px] rounded-br-[14px] border border-white bg-ld-dark-2 px-4 py-2 text-[14px] text-white/85">
            {statement.eyebrow}
          </span>
        </Reveal>

        <Reveal delay={90}>
          <h2 className="mx-auto mt-7 max-w-5xl text-[38px] leading-[1.04] font-bold tracking-[-0.04em] text-white md:text-8xl">
            {statement.headline}
          </h2>
        </Reveal>

        <Reveal delay={170}>
          {/* Abstract decorative panel */}
          <GradientArt
            palette="pink"
            shape="hill"
            grid
            className="mt-10 h-[160px] rounded-[24px] md:h-[200px]"
          >
            <Sparkle size={26} className="absolute top-[44%] left-[36%]" />
            <Sparkle size={18} className="absolute top-[62%] left-[57%]" />
            <Sparkle size={14} className="absolute top-[52%] left-[64%]" />
          </GradientArt>
        </Reveal>
      </div>
    </section>
  );
}
