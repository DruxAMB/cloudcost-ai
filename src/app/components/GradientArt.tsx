"use client";

import { useId } from "react";

/**
 * Abstract decorative gradient panels.
 *
 * Original decorative shapes (hills, arcs, diagonals, sparkles) used to fill
 * the illustration slots in the layout. Not reproductions of third-party art.
 */

export type Palette =
  | "lime"
  | "pink"
  | "orange"
  | "blue"
  | "yellow"
  | "magenta"
  | "cyan";

const stops: Record<Palette, [string, string, string]> = {
  lime: ["#7ffaa8", "#3CB936", "#2a8f28"],
  pink: ["#FB3C4F", "#e03548", "#c43038"],
  orange: ["#FFB347", "#FF841F", "#FB3C4F"],
  blue: ["#618bff", "#377FEA", "#5528b8"],
  yellow: ["#ebc346", "#d4af38", "#b8962e"],
  magenta: ["#6937EA", "#FB3C4F", "#c43038"],
  cyan: ["#9bc4ff", "#5d9bff", "#377FEA"],
};

export type Shape = "hill" | "arc" | "diagonal" | "block" | "wave";

/** Silhouettes drawn in a 400x200 viewBox, anchored to the bottom edge. */
const paths: Record<Shape, string> = {
  hill: "M0 200v-46c58-52 118-6 188-40s122-58 212-26v112Z",
  arc: "M0 200v-52C0 74 400 74 400 148v52Z",
  diagonal: "M0 200 400 34v166Z",
  block: "M0 0h400v200H0Z",
  wave: "M0 200v-72c54-14 112 10 168 26s122 10 232-42v88Z",
};

/** Four-point sparkle accent. */
export function Sparkle({
  size = 34,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M20 0c1.4 10.6 8 17.2 20 18.6v2.8C28 22.8 21.4 29.4 20 40c-1.4-10.6-8-17.2-20-18.6v-2.8C12 17.2 18.6 10.6 20 0Z"
        fill="#fff"
        stroke="#191919"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export default function GradientArt({
  palette = "lime",
  shape = "hill",
  grid = true,
  className = "",
  children,
}: {
  palette?: Palette;
  shape?: Shape;
  grid?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  // useId keeps gradient/pattern ids unique per instance — reusing a static id
  // makes every panel of the same palette resolve to the first one rendered.
  const uid = useId().replace(/:/g, "");
  const gradId = `g-${uid}`;
  const gridId = `p-${uid}`;
  const clipId = `c-${uid}`;

  const [a, b, c] = stops[palette];

  return (
    <div className={`relative overflow-hidden bg-ld-dark ${className}`}>
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={a} />
            <stop offset="55%" stopColor={b} />
            <stop offset="100%" stopColor={c} />
          </linearGradient>

          <pattern id={gridId} width="34" height="34" patternUnits="userSpaceOnUse">
            <path
              d="M34 0H0v34"
              fill="none"
              stroke="rgba(25,25,25,0.18)"
              strokeWidth="1"
            />
          </pattern>

          <clipPath id={clipId}>
            <path d={paths[shape]} />
          </clipPath>
        </defs>

        <path d={paths[shape]} fill={`url(#${gradId})`} />
        {grid && (
          <rect
            x="0"
            y="0"
            width="400"
            height="200"
            fill={`url(#${gridId})`}
            clipPath={`url(#${clipId})`}
          />
        )}
      </svg>

      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}
