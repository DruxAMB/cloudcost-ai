"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLenis } from "../lib/lenis-context";
import AppSlot from "./AppSlot";

gsap.registerPlugin(useGSAP);

/**
 * The shell that owns the landing ↔ app transition.
 *
 * Both layers are always in the DOM — the app is server-rendered and hidden
 * behind the landing, so the "Try the demo" click reveals an already-mounted
 * surface. No mount, no fetch, no layout shift at reveal time. That is the
 * whole point of the pattern: the transition is pure visual, so it cannot
 * fail on a slow network or a cold render.
 *
 * URL contract:
 *   `/`         → landing visible
 *   `/?app=1`   → app visible
 *
 * The URL is updated with `history.pushState` (not `router.push`) so the
 * transition animation is not interrupted by a server re-render. `popstate`
 * is listened to so the browser back/forward buttons stay in sync.
 *
 * `#app` anchors (hero CTA, header CTA) are intercepted globally and trigger
 * `openApp()`.
 *
 * `appOpen` is React state so `aria-hidden` / `inert` re-render correctly;
 * `appOpenRef` mirrors it so the imperative GSAP callbacks never read a stale
 * closure.
 */
export default function HomeClient({
  initialAppOpen,
  children,
}: {
  initialAppOpen: boolean;
  children: React.ReactNode;
}) {
  const landingRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const [appOpen, setAppOpen] = useState(initialAppOpen);
  const appOpenRef = useRef(initialAppOpen);
  const lenis = useLenis();

  const setBoth = useCallback((open: boolean) => {
    appOpenRef.current = open;
    setAppOpen(open);
  }, []);

  // Sync body scroll lock + Lenis with the open state.
  const applyScrollLock = useCallback(
    (open: boolean) => {
      if (open) {
        document.body.style.overflow = "hidden";
        lenis?.stop();
      } else {
        document.body.style.overflow = "";
        lenis?.start();
      }
    },
    [lenis]
  );

  const openApp = useCallback(() => {
    if (appOpenRef.current) return;
    setBoth(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const app = appRef.current;
    const landing = landingRef.current;

    if (reduced || !app || !landing) {
      // Instant swap — no animation.
      gsap.set(app, { opacity: 1, scale: 1, pointerEvents: "auto" });
      gsap.set(landing, { opacity: 0, pointerEvents: "none" });
    } else {
      // Scroll to top first so the app starts at its top, not mid-landing.
      window.scrollTo({ top: 0, behavior: "auto" });
      if (lenis) lenis.scrollTo(0, { immediate: true });

      const tl = gsap.timeline();
      tl.set(app, { pointerEvents: "auto" })
        .to(
          landing,
          { opacity: 0, duration: 0.3, ease: "power2.out" },
          0
        )
        .fromTo(
          app,
          { opacity: 0, scale: 1.02 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          0
        )
        .set(landing, { pointerEvents: "none" });
    }

    applyScrollLock(true);
    if (window.location.search !== "?app=1") {
      window.history.pushState({}, "", "?app=1");
    }
  }, [applyScrollLock, lenis, setBoth]);

  const closeApp = useCallback(() => {
    if (!appOpenRef.current) return;
    setBoth(false);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const app = appRef.current;
    const landing = landingRef.current;

    if (reduced || !app || !landing) {
      gsap.set(app, { opacity: 0, scale: 1.02, pointerEvents: "none" });
      gsap.set(landing, { opacity: 1, pointerEvents: "auto" });
    } else {
      const tl = gsap.timeline();
      tl.set(landing, { pointerEvents: "auto" })
        .to(
          app,
          { opacity: 0, scale: 1.02, duration: 0.4, ease: "power2.inOut" },
          0
        )
        .to(
          landing,
          { opacity: 1, duration: 0.4, ease: "power2.inOut" },
          0
        )
        .set(app, { pointerEvents: "none" });
    }

    applyScrollLock(false);
    if (window.location.search !== "") {
      window.history.pushState({}, "", "/");
    }
  }, [applyScrollLock, setBoth]);

  // Initial state: if the server said app is open, show it immediately with
  // no animation (direct navigation to ?app=1).
  useGSAP(
    () => {
      if (initialAppOpen) {
        const app = appRef.current;
        const landing = landingRef.current;
        if (app && landing) {
          gsap.set(app, { opacity: 1, scale: 1, pointerEvents: "auto" });
          gsap.set(landing, { opacity: 0, pointerEvents: "none" });
        }
        applyScrollLock(true);
      }
    },
    { scope: appRef, dependencies: [] }
  );

  // Intercept #app anchor clicks globally (hero CTA, header CTA).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href="#app"]');
      if (!anchor) return;
      e.preventDefault();
      openApp();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openApp]);

  // Keep state in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => {
      const open = new URLSearchParams(window.location.search).get("app") === "1";
      if (open && !appOpenRef.current) openApp();
      else if (!open && appOpenRef.current) closeApp();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [openApp, closeApp]);

  // Cleanup inline styles on unmount so nothing leaks.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Landing layer */}
      <div ref={landingRef} aria-hidden={appOpen || undefined} inert={appOpen || undefined}>
        {children}
      </div>

      {/* App layer — fixed, full-viewport, server-rendered and hidden until
          the hero CTA is clicked. pointer-events and opacity are driven by
          GSAP above; the inline style is the reduced-motion / pre-hydration
          fallback so the app never flashes before the click. */}
      <div
        ref={appRef}
        aria-hidden={!appOpen || undefined}
        inert={!appOpen || undefined}
        className="fixed inset-0 z-[100] cc-app bg-ld-dark"
        style={{
          opacity: appOpen ? 1 : 0,
          pointerEvents: appOpen ? "auto" : "none",
        }}
      >
        <AppSlot onExit={closeApp} appOpen={appOpen} />
      </div>
    </>
  );
}
