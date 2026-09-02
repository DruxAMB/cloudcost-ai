import { footerLinks, footer, project } from "../content";

/**
 * Footer.
 *
 * The source design had three columns of marketing pages (Careers, Partner
 * Program, Trust Center) and a newsletter capture. A hackathon project has
 * none of those, and shipping them as dead `#` links reads as carelessness on
 * the last thing a judge scrolls past. So this is one column of links that
 * actually resolve, plus the credit line.
 *
 * Add a social link only if the account exists and is about this project.
 */

/** Original glyphs standing in for social marks. */
const socialPaths: Record<string, string> = {
  GitHub:
    "M12 2A10 10 0 0 0 8.8 21.5c.5.1.7-.2.7-.5v-1.7C6.7 19.9 6.1 18 6.1 18c-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.2-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  YouTube:
    "M21 7.5c-.2-1-1-1.7-2-1.9C17 5.2 12 5.2 12 5.2s-5 0-7 .4c-1 .2-1.8.9-2 1.9C2.6 9.3 2.6 12 2.6 12s0 2.7.4 4.5c.2 1 1 1.7 2 1.9 2 .4 7 .4 7 .4s5 0 7-.4c1-.2 1.8-.9 2-1.9.4-1.8.4-4.5.4-4.5s0-2.7-.4-4.5ZM9.9 15.2V8.8l5.5 3.2-5.5 3.2Z",
  X: "M2 2l8 8-8 8h2.6L12 11.6 18 18h2L11.6 9.6 19.4 2H17l-6.4 6.4L4.6 2Z",
};

/** Only rendered when the URL is a real one. */
const socials = [
  { name: "GitHub", href: footerLinks.find((l) => l.label === "GitHub")?.href },
  { name: "YouTube", href: footerLinks.find((l) => l.label === "Demo video")?.href },
];

export default function Footer() {
  return (
    <footer className="lime-field pt-4 pb-8 text-ld-dark">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="grid gap-10 pb-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
          {/* Project blurb */}
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em]">
              {project.name}
            </h3>
            <p className="mt-2.5 max-w-[380px] text-[13px] leading-[1.5] text-ld-dark/70">
              {footer.blurb}
            </p>

            <div className="mt-5 flex gap-3.5">
              {socials.map((s) =>
                s.href ? (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="text-ld-dark/70 transition-colors hover:text-ld-dark"
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d={socialPaths[s.name]} />
                    </svg>
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Links — every one resolves. Delete any you do not have. */}
          <div className="lg:justify-self-end">
            <div className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-ld-dark/60 uppercase">
              Project
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-12">
              {footerLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target={l.href.startsWith("#") ? undefined : "_blank"}
                    rel={l.href.startsWith("#") ? undefined : "noopener noreferrer"}
                    className="text-[13px] leading-[1.4] text-ld-dark/85 transition-colors hover:text-ld-dark hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start justify-between gap-2 border-t border-ld-dark/20 pt-5 text-[12px] text-ld-dark/70 sm:flex-row sm:items-center sm:gap-6">
          <span>{footer.credit}</span>
          <span>
            © {project.year} {project.author}. MIT licensed.
          </span>
        </div>
      </div>
    </footer>
  );
}
