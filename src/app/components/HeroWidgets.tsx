"use client";

import { useEffect, useRef, useState } from "react";

/* ======================================================================
   Widget data types — used by the `heroWidgets` config in content.ts.
   The agent fills in labels/numbers; the chart shapes and animation
   props are design data that stays as real values.
   ====================================================================== */

export type Delta = {
  value: string;
  positive?: boolean;
  /** Override the positive/negative badge colours. Defaults to green/pink. */
  positiveColor?: string;
  negativeColor?: string;
};

export type SparklineData = {
  /** Unique SVG gradient id — must not collide across widgets. */
  id: string;
  color: string;
  line: string;
  area: string;
  height?: number;
  drawDelay?: number;
  xLabels?: string[];
};

export type WidgetData =
  | {
      kind: "stat-sparkline";
      label: string;
      meta?: string;
      dotColor: string;
      value: number;
      prefix?: string;
      suffix?: string;
      decimals?: number;
      delay?: number;
      delta?: Delta;
      tabs?: string[];
      sparkline: SparklineData;
    }
  | {
      kind: "stat-bars";
      label: string;
      meta?: string;
      dotColor: string;
      subLabel?: string;
      chips?: string[];
      value: number;
      suffix?: string;
      decimals?: number;
      delay?: number;
      delta?: Delta;
      bars: { heights: number[]; color: string; highlightFrom?: number };
    }
  | {
      kind: "bars-horizontal";
      title: string;
      meta?: string;
      rows: { label: string; value: number; color: string }[];
    }
  | {
      kind: "stat-percent";
      label: string;
      value: number;
      decimals?: number;
      delay?: number;
      delta?: Delta;
      gradient: { id: string; from: string; to: string };
      xLabels: string[];
    }
  | {
      kind: "group-by";
      label: string;
      value: string;
    }
  | {
      kind: "icon-tile";
      palette: "orange" | "purple";
    };

export type HeroWidgetItem = {
  /** The widget to render. */
  widget: WidgetData;
  /** Wrapper className — width, snap, margin. */
  className: string;
  /** Entry animation X offset (px). */
  entryX?: number;
  /** Entry animation Y offset (px). */
  entryY?: number;
  /** Float animation X amplitude (px). */
  floatX?: number;
  /** Float animation Y amplitude (px). */
  floatY?: number;
  /** Float direction. */
  dir?: 1 | -1;
  /** Entry delay (seconds). */
  entryDelay?: number;
  /** Float duration (seconds). */
  floatDur?: number;
};

/* ------------------------------------------------------------------
   Shared helpers
   ------------------------------------------------------------------ */

/** rAF-driven counter, matching the requestAnimationFrame approach LD uses. */
function useCountUp(
  target: number,
  { duration = 1500, delay = 700, decimals = 0 } = {}
) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVal(target);
      return;
    }

    let raf = 0;
    let start = 0;

    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };

    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}

type Vars = React.CSSProperties & Record<string, string | number>;

/** Convert #rrggbb + alpha to rgba() string, matching the original widget format. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Widget shell. Entry offset and float direction are set per-instance via CSS
 * custom properties so every card drifts on its own independent path.
 * Entry and float are on separate elements because both animate `transform`.
 */
export function Widget({
  children,
  className = "",
  entryX = 80,
  entryY = 0,
  floatX = 10,
  floatY = 12,
  dir = 1,
  entryDelay = 0,
  floatDur = 9,
}: {
  children: React.ReactNode;
  className?: string;
  entryX?: number;
  entryY?: number;
  floatX?: number;
  floatY?: number;
  dir?: 1 | -1;
  entryDelay?: number;
  floatDur?: number;
}) {
  return (
    <div className={className}>
      <div
        className="widget-enter"
        style={
          {
            "--entry-x": `${entryX}px`,
            "--entry-y": `${entryY}px`,
            "--entry-delay": `${entryDelay}s`,
          } as Vars
        }
      >
        <div
          className="widget-float"
          style={
            {
              "--float-x": `${floatX}px`,
              "--float-y": `${floatY}px`,
              "--float-dir-x": dir,
              "--float-dur": `${floatDur}s`,
              "--float-delay": `${entryDelay + 0.9}s`,
            } as Vars
          }
        >
          <div className="flex min-h-[280px] flex-col rounded-[28px] border border-white/10 bg-ld-dark-2/85 p-6 shadow-2xl backdrop-blur-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Line chart that draws itself in via stroke-dashoffset. */
function Sparkline({
  line,
  area,
  color,
  id,
  drawDelay = 0.35,
  height = 68,
}: {
  line: string;
  area: string;
  color: string;
  id: string;
  drawDelay?: number;
  height?: number;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [dash, setDash] = useState(420);

  useEffect(() => {
    if (ref.current) setDash(Math.ceil(ref.current.getTotalLength()) + 4);
  }, [line]);

  return (
    <svg
      viewBox={`0 0 300 ${height}`}
      className="h-auto w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.3, 0.6, 0.9].map((f) => (
        <line
          key={f}
          x1="0"
          y1={height * f}
          x2="300"
          y2={height * f}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      <path
        d={area}
        fill={`url(#${id})`}
        className="area-fade"
        style={{ "--area-delay": `${drawDelay + 0.55}s` } as Vars}
      />
      <path
        ref={ref}
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className="draw-line"
        style={{ "--dash": dash, "--draw-delay": `${drawDelay}s` } as Vars}
      />
    </svg>
  );
}

function Delta({
  value,
  positive,
  positiveColor = "#3CB936",
  negativeColor = "#FB3C4F",
}: {
  value: string;
  positive?: boolean;
  positiveColor?: string;
  negativeColor?: string;
}) {
  const color = positive ? positiveColor : negativeColor;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return (
    <span
      className="rounded-[90px] px-2 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: `rgba(${r},${g},${b},0.15)`,
        color,
      }}
    >
      {value}
    </span>
  );
}

function WidgetHead({
  label,
  meta,
  dot,
}: {
  label: string;
  meta?: string;
  dot?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {dot && (
          <span
            className="h-2 w-2 animate-pulse-dot rounded-full"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className="text-[12px] font-semibold tracking-wide text-white/60 uppercase">
          {label}
        </span>
      </div>
      {meta && <span className="font-mono text-[11px] text-white/35">{meta}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------
   Widget components — data-driven, render from WidgetData props.
   Each preserves the exact DOM structure of the original hardcoded
   widget so animations and visual output are byte-identical.
   ------------------------------------------------------------------ */

/** Big number + optional delta + sparkline. Handles cost and toxicity shapes. */
function StatSparklineWidget({
  data,
}: {
  data: Extract<WidgetData, { kind: "stat-sparkline" }>;
}) {
  const val = useCountUp(data.value, {
    delay: data.delay ?? 650,
    decimals: data.decimals ?? 0,
  });
  const [tab, setTab] = useState(0);
  // Prefix → smaller font (matches original CostWidget at 40px vs 44px).
  const sizeClass = data.prefix ? "text-[40px]" : "text-[44px]";

  return (
    <div className="w-full">
      <WidgetHead label={data.label} meta={data.meta} dot={data.dotColor} />

      {data.tabs && (
        <div className="mb-3 flex flex-wrap gap-1">
          {data.tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className="cursor-pointer rounded-[90px] px-2 py-1 text-[10px] transition-colors"
              style={{
                backgroundColor: tab === i ? data.dotColor : "rgba(255,255,255,0.06)",
                color: tab === i ? "#191919" : "rgba(255,255,255,0.6)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="mb-2 flex items-baseline gap-2">
        <span
          className={`${sizeClass} leading-none font-bold tracking-[-0.03em] text-white tabular-nums`}
        >
          {data.prefix}
          {val}
          {data.suffix}
        </span>
        {data.delta && (
          <Delta
            value={data.delta.value}
            positive={data.delta.positive}
            positiveColor={data.delta.positiveColor}
            negativeColor={data.delta.negativeColor}
          />
        )}
      </div>

      <Sparkline
        id={data.sparkline.id}
        color={data.sparkline.color}
        drawDelay={data.sparkline.drawDelay ?? 0.35}
        height={data.sparkline.height ?? 68}
        line={data.sparkline.line}
        area={data.sparkline.area}
      />

      {data.sparkline.xLabels && (
        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-white/30">
          {data.sparkline.xLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Big number with suffix + vertical bar chart. */
function StatBarsWidget({
  data,
}: {
  data: Extract<WidgetData, { kind: "stat-bars" }>;
}) {
  const score = useCountUp(data.value, {
    delay: data.delay ?? 900,
    decimals: data.decimals ?? 0,
  });

  return (
    <div className="w-full">
      <WidgetHead label={data.label} meta={data.meta} dot={data.dotColor} />

      {data.subLabel && (
        <div className="mb-1 text-[11px] text-white/50">{data.subLabel}</div>
      )}

      {data.chips && (
        <div className="mb-3 flex items-center gap-2 text-[10px] text-white/35">
          {data.chips.map((c) => (
            <span key={c} className="rounded-[90px] bg-white/[0.06] px-2 py-0.5">
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <span className="text-[56px] leading-none font-bold tracking-[-0.04em] text-ld-lime tabular-nums">
          {score}
          {data.suffix}
        </span>
      </div>

      <div className="mt-3 flex h-8 items-end gap-1">
        {data.bars.heights.map((h, i) => (
          <span
            key={i}
            className="bar-grow flex-1 rounded-t-[3px]"
            style={
              {
                height: `${h}%`,
                backgroundColor:
                  data.bars.highlightFrom !== undefined && i >= data.bars.highlightFrom
                    ? data.bars.color
                    : hexToRgba(data.bars.color, 0.35),
                "--bar-delay": `${0.7 + i * 0.07}s`,
              } as Vars
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar rows with labels and percentages. */
function BarsHorizontalWidget({
  data,
}: {
  data: Extract<WidgetData, { kind: "bars-horizontal" }>;
}) {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[15px] text-white/90">{data.title}</span>
        {data.meta && (
          <span className="rounded-[6px] bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
            {data.meta}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {data.rows.map((r, i) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-white/55">{r.label}</span>
              <span className="font-mono text-[11px] text-white/75">{r.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[90px] bg-white/[0.08]">
              <div
                className="fill-width h-full rounded-[90px]"
                style={
                  {
                    backgroundColor: r.color,
                    "--fill": `${r.value}%`,
                    "--fill-delay": `${0.5 + i * 0.14}s`,
                  } as Vars
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Big percentage with decorative gradient corner. */
function StatPercentWidget({
  data,
}: {
  data: Extract<WidgetData, { kind: "stat-percent" }>;
}) {
  const pct = useCountUp(data.value, {
    delay: data.delay ?? 700,
    decimals: data.decimals ?? 0,
  });

  return (
    <div className="relative w-full overflow-hidden">
      <div className="mb-2 text-[13px] text-white/70">{data.label}</div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-[44px] leading-none font-bold tracking-[-0.03em] text-white tabular-nums">
          {pct}%
        </span>
        {data.delta && (
          <Delta
            value={data.delta.value}
            positive={data.delta.positive}
            positiveColor={data.delta.positiveColor}
            negativeColor={data.delta.negativeColor}
          />
        )}
      </div>
      <div className="relative h-14">
        <svg viewBox="0 0 200 56" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={data.gradient.id} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor={data.gradient.from} />
              <stop offset="100%" stopColor={data.gradient.to} />
            </linearGradient>
          </defs>
          <path d="M0 56C0 20 40 0 92 0v56Z" fill={`url(#${data.gradient.id})`} />
          {[0.33, 0.66].map((f) => (
            <line key={f} x1="0" y1={56 * f} x2="200" y2={56 * f} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9px] text-white/30">
          {data.xLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Select-style widget with a label and value. */
function GroupByWidget({
  data,
}: {
  data: Extract<WidgetData, { kind: "group-by" }>;
}) {
  return (
    <div className="w-full">
      <div className="mb-2.5 text-[13px] text-white/80">{data.label}</div>
      <div className="flex items-center justify-between rounded-[8px] border border-white/12 bg-white/[0.04] px-3 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[12px] text-white/70">
          <span className="h-2 w-2 rotate-45 bg-ld-blue" />
          {data.value}
        </span>
        <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden>
          <path d="M1 1.5 5 5.5l4-4" stroke="currentColor" strokeWidth="1.4" className="text-white/40" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/** Small product icon tile with a gradient face. */
export function IconTile({
  palette = "orange",
}: {
  palette?: "orange" | "purple";
}) {
  const bg =
    palette === "orange"
      ? "linear-gradient(135deg,#FFB347 0%,#FF841F 50%,#FB3C4F 100%)"
      : "linear-gradient(135deg,#618bff 0%,#377FEA 45%,#6937EA 100%)";

  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-[16px] border border-white/15 shadow-lg"
      style={{ background: bg }}
      aria-hidden
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path d="M4 12h13" stroke="#191919" strokeWidth="2" strokeLinecap="round" />
        <path d="M13 6.5 18.5 12 13 17.5" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------
   Renderer — maps a HeroWidgetItem to the right widget + wrapper.
   Icon tiles use an entry-only div (no float); everything else uses
   the full Widget shell with entry + float.
   ------------------------------------------------------------------ */

export function HeroWidgetRenderer({ item }: { item: HeroWidgetItem }) {
  const { widget, className, entryX, entryY, floatX, floatY, dir, entryDelay, floatDur } = item;

  // Icon tiles use a bare entry-only div (no float animation), matching
  // the original Hero.tsx layout exactly.
  if (widget.kind === "icon-tile") {
    return (
      <div
        className={`widget-enter ${className}`}
        style={
          {
            "--entry-y": `${entryY ?? 30}px`,
            "--entry-x": `${entryX ?? 0}px`,
            "--entry-delay": `${entryDelay ?? 0}s`,
          } as Vars
        }
      >
        <IconTile palette={widget.palette} />
      </div>
    );
  }

  // All other widgets use the full Widget shell (entry + float).
  return (
    <Widget
      className={className}
      entryX={entryX}
      entryY={entryY}
      floatX={floatX}
      floatY={floatY}
      dir={dir}
      entryDelay={entryDelay}
      floatDur={floatDur}
    >
      {widget.kind === "stat-sparkline" && <StatSparklineWidget data={widget} />}
      {widget.kind === "stat-bars" && <StatBarsWidget data={widget} />}
      {widget.kind === "bars-horizontal" && <BarsHorizontalWidget data={widget} />}
      {widget.kind === "stat-percent" && <StatPercentWidget data={widget} />}
      {widget.kind === "group-by" && <GroupByWidget data={widget} />}
    </Widget>
  );
}

/* ------------------------------------------------------------------
   Additional widget components — not used in the default hero widget
   band, but available for custom configs. Add them to `heroWidgets`
   in content.ts if you want them; they accept the same WidgetData shape.
   ------------------------------------------------------------------ */

export function ModelDonutWidget() {
  const segments = [
    { label: "GPT-5.5", value: 50, color: "#6937EA" },
    { label: "Claude Sonnet 4.6", value: 35, color: "#FB3C4F" },
    { label: "Claude Opus 4.7", value: 10, color: "#377FEA" },
    { label: "Text Embedding 3", value: 5, color: "#7ffaa8" },
  ];

  const r = 34;
  const circ = +(2 * Math.PI * r).toFixed(2);
  let acc = 0;

  return (
    <div className="w-full">
      <WidgetHead label="Model Distribution" meta="last 7d" dot="#377FEA" />
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 90 90" className="h-[86px] w-[86px] shrink-0 -rotate-90" aria-hidden>
          <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
          {segments.map((s, i) => {
            const len = +((s.value / 100) * circ).toFixed(2);
            const offset = acc;
            acc += len;
            return (
              <circle
                key={s.label}
                cx="45"
                cy="45"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="11"
                strokeDashoffset={-offset}
                className="seg-grow"
                style={
                  {
                    "--circ": circ,
                    "--len": len,
                    "--seg-delay": `${0.5 + i * 0.16}s`,
                  } as Vars
                }
              />
            );
          })}
        </svg>

        <div className="min-w-0 flex-1 space-y-1.5">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[11px]">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="truncate text-white/70">{s.label}</span>
              <span className="ml-auto font-mono text-white/40">{s.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AccuracyWidget() {
  const acc = useCountUp(98.4, { delay: 800, decimals: 1 });

  return (
    <div className="w-full">
      <WidgetHead label="Accuracy" dot="#3CB936" />
      <div className="flex items-baseline gap-2">
        <span className="text-[44px] leading-none font-bold tracking-[-0.03em] text-white tabular-nums">
          {acc}%
        </span>
        <Delta value="+2.1%" positive />
      </div>
      <div className="mt-3 flex h-9 items-end gap-1">
        {[52, 64, 58, 76, 70, 84, 92].map((h, i) => (
          <span
            key={i}
            className="bar-grow flex-1 rounded-t-[3px]"
            style={
              {
                height: `${h}%`,
                backgroundColor: "#3CB936",
                opacity: 0.35 + i * 0.09,
                "--bar-delay": `${0.6 + i * 0.08}s`,
              } as Vars
            }
          />
        ))}
      </div>
    </div>
  );
}

export function RolloutWidget() {
  return (
    <div className="w-full">
      <WidgetHead label="Rollout duration" meta="live" dot="#377FEA" />
      <div className="space-y-2.5">
        {[
          { name: "Canary", pct: 100, color: "#3CB936" },
          { name: "25% traffic", pct: 100, color: "#3CB936" },
          { name: "50% traffic", pct: 62, color: "#377FEA" },
          { name: "Full release", pct: 0, color: "rgba(255,255,255,0.15)" },
        ].map((s, i) => (
          <div key={s.name}>
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="text-white/60">{s.name}</span>
              <span className="font-mono text-white/35">{s.pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[90px] bg-white/[0.07]">
              <div
                className="fill-width h-full rounded-[90px]"
                style={
                  {
                    backgroundColor: s.color,
                    "--fill": `${s.pct}%`,
                    "--fill-delay": `${0.6 + i * 0.15}s`,
                  } as Vars
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExperimentsWidget() {
  const n = useCountUp(24, { delay: 750 });

  return (
    <div className="w-full">
      <WidgetHead label="Active experiments" dot="#FF841F" />
      <div className="mb-3 text-[42px] leading-none font-bold tracking-[-0.03em] text-white tabular-nums">
        {n}
      </div>
      <div className="space-y-1.5">
        {[
          { name: "checkout-v3", tag: "winning", color: "#3CB936" },
          { name: "prompt-tone-b", tag: "running", color: "#FF841F" },
          { name: "model-router", tag: "running", color: "#FF841F" },
        ].map((e) => (
          <div key={e.name} className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-white/65">{e.name}</span>
            <span
              className="rounded-[90px] px-2 py-0.5 text-[10px]"
              style={{ backgroundColor: `${e.color}26`, color: e.color }}
            >
              {e.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SdkWidget() {
  return (
    <div className="w-full">
      <WidgetHead label="SDK" dot="#6937EA" />
      <pre className="overflow-hidden rounded-[12px] bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-white/75">
        <span className="text-white/35">{"// swap for a real call from your app"}</span>
        {"\n"}
        <span style={{ color: "#FB3C4F" }}>const</span> result ={" "}
        <span style={{ color: "#7ffaa8" }}>await</span> client.
        <span style={{ color: "#377FEA" }}>run</span>({"{"}
        {"\n"}
        {"  input: "}
        <span style={{ color: "#3CB936" }}>{'"..."'}</span>,
        {"\n"}
        {"  mode: "}
        <span style={{ color: "#3CB936" }}>{'"fast"'}</span>
        {"\n"}
        {"});"}
      </pre>
    </div>
  );
}

/** Cluster label chip, e.g. a subsystem or model name. */
export function ClusterLabel({
  label,
  color,
  className = "",
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span
        className="inline-flex items-center gap-1.5 rounded-[90px] px-3 py-1.5 text-[12px] font-semibold"
        style={{ backgroundColor: color, color: "#191919" }}
      >
        {label}
        <svg width="11" height="8" viewBox="0 0 14 10" fill="none" aria-hidden>
          <path
            d="M1 5h11M8 1l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
