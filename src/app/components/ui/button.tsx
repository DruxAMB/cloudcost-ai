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
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ld-lime focus-visible:ring-offset-2 focus-visible:ring-offset-ld-dark disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ld-lime text-ld-dark hover:bg-ld-lime/90",
        secondary: "border border-white/25 text-white hover:bg-white/10",
        ghost: "text-white/80 hover:bg-white/10 hover:text-white",
        destructive: "bg-ld-pink text-white hover:bg-ld-pink/90",
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

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
