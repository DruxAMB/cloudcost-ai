"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * shadcn-style Button, written against this project's existing token names
 * rather than installed via `shadcn init` — init rewrites globals.css, which
 * here holds every keyframe and the whole motion layer.
 *
 * Focus ring is not optional. Neither is the disabled state.
 * Hover uses the LD design system's btn-fill slide-up effect — same as the
 * landing page buttons — so the app and landing page share one motion language.
 * CSS vars --fill-bg / --fill-text are set via inline style, matching the
 * landing page pattern (Tailwind arbitrary property syntax is not used).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ld-lime focus-visible:ring-offset-2 focus-visible:ring-offset-ld-dark disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-fill bg-ld-lime text-ld-dark",
        secondary: "btn-fill border border-white/25 text-white",
        ghost: "text-white/80 hover:bg-white/10 hover:text-white",
        destructive: "btn-fill bg-ld-pink text-white",
        outline: "btn-fill border border-white/15 text-white",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-[14px]",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const fillVars: Record<string, React.CSSProperties> = {
  default: { ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#7ffaa8" },
  secondary: { ["--fill-bg" as string]: "#ffffff", ["--fill-text" as string]: "#191919" },
  destructive: { ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#fb3c4f" },
  outline: { ["--fill-bg" as string]: "#ffffff", ["--fill-text" as string]: "#191919" },
};

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  style,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  const fillStyle = variant && variant in fillVars ? fillVars[variant] : {};
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ ...fillStyle, ...style }}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <span className="btn-fill-label inline-flex items-center gap-2">{children}</span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
