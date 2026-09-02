"use client";

import { createContext, useContext } from "react";
import type Lenis from "lenis";

/**
 * Exposes the Lenis instance created by `SmoothScroll` so other components
 * can call `lenis.scrollTo(...)` and get the smoothed scroll, instead of
 * fighting Lenis with a raw `window.scrollTo`.
 *
 * `null` when reduced motion is on (SmoothScroll skips creating Lenis) or
 * before mount. Consumers must fall back to native scroll in that case.
 */
export const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}
