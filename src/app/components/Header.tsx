"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MobileMenu from "./MobileMenu";
import { nav as navItems, headerCta, project, logo } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Brand mark rendered from the `logo` field in content.ts.
 * Single-path SVG, 24×24 viewBox, stroked with currentColor so it inherits
 * the collapse animation's colour. If your mark needs multiple paths or
 * fills, inline the SVG here directly and ignore `logo.path`.
 */
function LogoGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      {logo.path.split(" M").map((d, i) => (
        <path
          key={i}
          d={i === 0 ? d : `M${d}`}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export default function Header() {
  const [mobile, setMobile] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const topLine = useRef<SVGLineElement>(null);
  const midLine = useRef<SVGLineElement>(null);
  const bottomLine = useRef<SVGLineElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Slide the highlight blob to the hovered nav item.
  // Pass null to hide it (when mouse leaves the nav).
  const moveBlob = (target: HTMLElement | null) => {
    const blob = blobRef.current;
    const nav = navRef.current;
    if (!blob || !nav) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!target) {
      gsap.to(blob, { opacity: 0, duration: 0.3, ease: "power2.out" });
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    gsap.to(blob, {
      left: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const toggleMobile = () => {
    const next = !mobile;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMobile(next);
      return;
    }
    if (next) {
      // Opening
      setMobile(true);
      setClosing(false);
      // Hamburger → X
      gsap.to(topLine.current, { attr: { x1: 6, y1: 6, x2: 28, y2: 28 }, duration: 0.3, ease: "power2.inOut" });
      gsap.to(bottomLine.current, { attr: { x1: 6, y1: 28, x2: 28, y2: 6 }, duration: 0.3, ease: "power2.inOut" });
      gsap.to(midLine.current, { opacity: 0, duration: 0.2 });
    } else {
      // Closing — MobileMenu handles the liquid animation via `closing` prop.
      // We unmount after the animation duration.
      setClosing(true);
      // X → Hamburger
      gsap.to(topLine.current, { attr: { x1: 5, y1: 11, x2: 31, y2: 11 }, duration: 0.3, ease: "power2.inOut" });
      gsap.to(bottomLine.current, { attr: { x1: 5, y1: 25, x2: 31, y2: 25 }, duration: 0.3, ease: "power2.inOut" });
      gsap.to(midLine.current, { opacity: 1, duration: 0.2, delay: 0.1 });

      // Unmount after close animation completes (0.3s sink + 0.1s delay + 0.5s shrink)
      window.setTimeout(() => {
        setMobile(false);
        setClosing(false);
      }, 950);
    }
  };

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "+=80",
      onUpdate: (self) => {
        setScrollProgress((prev) => {
          if (Math.abs(prev - self.progress) < 0.01) return prev;
          return self.progress;
        });
      },
    });
  });

  // Logo collapses from 214px (with wordmark) to 56px (icon only)
  // over the first 80px of scrolling. Hover overrides to expanded.
  const logoWidth = hovered ? 214 : 214 - (214 - 54) * scrollProgress;

  return (
    <header className="sticky top-0 z-50 mx-auto pb-2 w-full max-w-[1400px]">
      <div className="relative flex h-[56px] items-center">
        {/* Logo tile: flush to the left edge, only the bottom-right corner
            rounded, expanding to reveal the wordmark on hover. */}
        <a
          href="#top"
          aria-label={logo.ariaLabel}
          className="group absolute top-0 left-0 flex h-full items-center overflow-hidden rounded-br-[12px] bg-ld-dark pl-[15px] text-white transition-[width] duration-300 ease-linear"
          style={{ width: `${logoWidth}px` }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(e) => {
            // Toggle wordmark on tap for touch devices
            if (window.matchMedia("(hover: none)").matches) {
              e.preventDefault();
              setHovered((v) => !v);
            }
          }}
        >
          {/* Brand mark reads from `logo` in content.ts. For a multi-path or
              filled mark, inline the SVG here and ignore logo.path. */}
          <LogoGlyph />
          <span className="ml-2.5 text-[19px] font-bold tracking-[-0.03em] whitespace-nowrap">
            {project.name}
          </span>
        </a>

        {/* Centered nav */}
        <nav
          ref={navRef}
          aria-label="Main"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex bg-ld-dark border-b rounded-b-2xl h-full"
          onMouseLeave={() => moveBlob(null)}
        >
          {/* Sliding blob background */}
          <div
            ref={blobRef}
            className="blob pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-[8px] bg-white/[0.08]"
            style={{ left: -100, width: 0, height: 32, opacity: 0 }}
          />

          {navItems.map((n) => (
            <div
              key={n.label}
              className="relative"
              onMouseEnter={(e) => moveBlob(e.currentTarget)}
            >
              <a
                href={n.href}
                className="relative z-10 block cursor-pointer rounded-[8px] border border-transparent px-3 py-2 text-[16px] font-normal text-white/80 transition-colors duration-300 hover:text-white"
              >
                {n.label}
              </a>
            </div>
          ))}
        </nav>

        {/* Right CTA */}
        <a
          href={headerCta.href}
          className="btn-fill !absolute top-2 right-4 hidden items-center justify-center gap-2 border rounded-[8px] bg-ld-lime px-6 py-2.5 text-[16px] font-semibold text-ld-dark lg:inline-flex"
          style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#7ffaa8" }}
        >
          <span className="btn-fill-label flex items-center gap-2">
            {headerCta.label}
            <svg width="15" height="11" viewBox="0 0 14 10" fill="none" aria-hidden>
              <path
                d="M1 5h11M8 1l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </a>

        {/* Mobile toggle */}
        <button
          ref={hamburgerRef}
          onClick={toggleMobile}
          aria-label="Menu"
          aria-expanded={mobile}
          className="absolute top-0 right-0 cursor-pointer rounded-bl-2xl bg-ld-dark p-2 text-white lg:hidden"
        >
          <svg width="40" height="40" viewBox="0 0 36 36" aria-hidden>
            <line ref={topLine} x1="5" y1="11" x2="31" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line ref={midLine} x1="5" y1="18" x2="31" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line ref={bottomLine} x1="5" y1="25" x2="31" y2="25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {(mobile || closing) && (
        <MobileMenu items={navItems} hamburgerRef={hamburgerRef} closing={closing} />
      )}
    </header>
  );
}
