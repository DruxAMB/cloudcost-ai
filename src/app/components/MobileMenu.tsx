"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { headerCta } from "../content";

gsap.registerPlugin(useGSAP);

/**
 * Mobile menu with liquid pour + float-up animation.
 *
 * OPEN: Liquid pours from hamburger (clip-path circle expands),
 * nav items float up with buoyancy physics.
 * CLOSE: Items sink down, liquid shrinks back to hamburger.
 */
export default function MobileMenu({
  items,
  hamburgerRef,
  closing = false,
}: {
  items: { label: string; href: string }[];
  hamburgerRef: React.RefObject<HTMLButtonElement | null>;
  closing?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const liquidRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGPathElement>(null);

  // Store origin coordinates so close animation can reuse them
  const originRef = useRef({ x: 100, y: 0 });

  // Opening animation — runs once on mount
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const burger = hamburgerRef.current;
      const menu = menuRef.current;
      const liquid = liquidRef.current;
      if (!burger || !menu || !liquid) return;

      const burgerRect = burger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const originX = ((burgerRect.left + burgerRect.width / 2 - menuRect.left) / menuRect.width) * 100;
      const originY = ((burgerRect.top + burgerRect.height / 2 - menuRect.top) / menuRect.height) * 100;

      originRef.current = { x: originX, y: originY };

      gsap.set(liquid, {
        clipPath: `circle(0% at ${originX}% ${originY}%)`,
      });

      const tl = gsap.timeline();

      // 1. Liquid pour
      tl.to(liquid, {
        clipPath: `circle(150% at ${originX}% ${originY}%)`,
        duration: 0.8,
        ease: "power2.inOut",
      }, 0);

      // 2. Nav items float up with buoyancy
      const links = gsap.utils.toArray<HTMLElement>(".liquid-nav-item");
      gsap.set(links, { y: 80, opacity: 0, rotation: -3 });

      links.forEach((link, i) => {
        const delay = 0.3 + i * 0.08;
        tl.to(link, {
          y: -8,
          opacity: 1,
          rotation: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.5)",
        }, delay)
        .to(link, {
          y: 0,
          duration: 0.4,
          ease: "power2.inOut",
        }, delay + 0.7);
      });

      // 3. CTA floats up last
      const cta = menuRef.current?.querySelector(".liquid-nav-cta");
      if (cta) {
        gsap.set(cta, { y: 100, opacity: 0, scale: 0.8 });
        tl.to(cta, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.4)",
        }, 0.3 + items.length * 0.08 + 0.1);
      }

      // 4. Wave animation
      const wave = waveRef.current;
      if (wave) {
        tl.to({ offset: 0 }, {
          offset: 40,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          onUpdate: function () {
            const o = this.targets()[0].offset;
            wave.setAttribute("transform", `translate(${o}, 0)`);
          },
        }, 0);
      }
    },
    { scope: menuRef }
  );

  // Close animation — runs when `closing` flips to true
  useGSAP(
    () => {
      if (!closing) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const liquid = liquidRef.current;
      const menu = menuRef.current;
      if (!liquid || !menu) return;

      const { x, y } = originRef.current;

      // Sink nav items down
      const items = menu.querySelectorAll(".liquid-nav-item, .liquid-nav-cta");
      gsap.to(items, {
        y: 60,
        opacity: 0,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.in",
      });

      // Shrink liquid back to hamburger
      gsap.to(liquid, {
        clipPath: `circle(0% at ${x}% ${y}%)`,
        duration: 0.5,
        ease: "power2.inOut",
        delay: 0.1,
      });
    },
    { dependencies: [closing], scope: menuRef }
  );

  return (
    <div ref={menuRef} className="relative mx-auto max-w-[1400px] overflow-hidden lg:hidden">
      {/* Liquid overlay — expands from hamburger position */}
      <div
        ref={liquidRef}
        className="mobile-liquid absolute inset-0 bg-ld-dark"
        style={{ clipPath: "circle(0% at 100% 0%)" }}
      >
        {/* Liquid surface wave */}
        <svg
          className="pointer-events-none absolute top-[56px] left-[-40px] w-[calc(100%+80px)] h-[20px]"
          viewBox="0 0 120 20"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            ref={waveRef}
            d="M0 10 Q 15 0, 30 10 T 60 10 T 90 10 T 120 10 V 20 H 0 Z"
            fill="rgba(255,255,255,0.04)"
          />
        </svg>
      </div>

      {/* Nav content */}
      <div className="relative z-10 px-4 pb-5">
        <ul className="space-y-1 pt-4">
          {items.map((n) => (
            <li key={n.label} className="liquid-nav-item">
              <a
                href={n.href}
                className="block py-2.5 text-[20px] font-semibold tracking-[-0.02em] text-white/90 transition-colors hover:text-ld-lime"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={headerCta.href}
          className="liquid-nav-cta btn-fill mt-4 inline-flex items-center gap-2 rounded-[8px] bg-ld-lime px-6 py-2.5 text-[16px] font-semibold text-ld-dark"
          style={{ ["--fill-bg" as string]: "#191919", ["--fill-text" as string]: "#7ffaa8" }}
        >
          <span className="btn-fill-label flex items-center gap-2">
            {headerCta.label}
            <svg width="15" height="11" viewBox="0 0 14 10" fill="none" aria-hidden>
              <path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
}
