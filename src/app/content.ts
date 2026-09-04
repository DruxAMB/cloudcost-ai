import type { HeroWidgetItem } from "./components/HeroWidgets";

/**
 * ============================================================================
 *  CloudCost AI — content for the landing page.
 *  Adapted from the ld-clone template.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// Project identity
// ---------------------------------------------------------------------------

export const project = {
  name: "CloudCost AI",
  title: "CloudCost AI — Architect cloud infrastructure, see the bill before you build",
  description:
    "Describe your app idea in plain English. CloudCost AI identifies the cloud services you need, projects costs from 1K to 100K users, and sends a signed cost report for stakeholder approval.",
  author: "Team DruxAMB",
  hackathon: "World Cloudx Hackathon 2026",
  year: new Date().getFullYear(),
};

/**
 * Brand mark shown in the header logo tile. Single-path SVG, 24×24 viewBox,
 * stroked with currentColor. CloudCost AI uses a cloud-with-dollar-sign glyph.
 */
export const logo = {
  path: "M7 18a5 5 0 0 1-1-9.9A6 6 0 0 1 18 8a4 4 0 0 1 1 7.9M9 14h6M12 11v6",
  ariaLabel: "CloudCost AI — home",
};

export const links = {
  demo: "#app",
  repo: "https://github.com/druxamb/cloudcost-ai",
  video: "https://youtu.be/C1UGOzpRDek",
  docs: "https://cloudcost-ai.druxamb.dev/",
};

export const demoVideoId = "C1UGOzpRDek";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "Architecture", href: "#architecture" },
  { label: "Resources", href: "#resources" },
];

export const headerCta = { label: "Try the demo", href: "#app" };

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export const hero = {
  headlineTop: "Know the cloud bill",
  headlineBottom: "before you build",
  sub: {
    lead: "Describe your app in plain English. CloudCost AI identifies the services, projects ",
    accentOne: "real costs",
    middle: " at scale, and delivers a ",
    accentTwo: "signed report",
    tail: " for stakeholder approval.",
  },
  primaryCta: { label: "Try the demo", href: "#app" },
  secondaryCta: { label: "Watch demo video", href: "#demo" },
};

// ---------------------------------------------------------------------------
// Hero widget band — the floating cards below the headline
// ---------------------------------------------------------------------------

/**
 * The animated cards in the hero's bottom band. They preview the tool's
 * output domain: a cost projection across user scales, a service breakdown,
 * a deployment target, and optimization opportunities. The numbers are
 * illustrative of what CloudCost AI produces for a typical SaaS app
 * (document upload + AI chat + payments at 10K users).
 *
 * COLOURS: hex values mirror the sponsor-synced accent scale in globals.css.
 * Each color is a verified brand color from a prize-track sponsor:
 *   #7ffaa8  Nutrient mint   (--lime, primary)
 *   #377FEA  SerpApi blue     (--blue)
 *   #6937EA  SerpApi purple   (--purple)
 *   #3CB936  Doctavian green  (--green)
 *   #FF841F  Doctavian orange (--orange)
 *   #FB3C4F  Doctavian red    (--pink)
 *   #ebc346  Xano gold        (--yellow)
 * SVG attributes cannot reference CSS custom properties, so they must be hex.
 * Sync manually if you retheme globals.css.
 *
 * Story flow (left → right):
 *   cost projection → service mix → services identified → savings
 */
export const heroWidgets: HeroWidgetItem[] = [
  // 1 — Cost projection: the money shot. How monthly cost scales 1K → 100K.
  {
    className: "w-[300px] shrink-0 snap-center sm:w-[380px]",
    entryX: -40,
    entryY: 40,
    floatX: 7,
    floatY: 9,
    dir: -1,
    entryDelay: 0.4,
    floatDur: 10,
    widget: {
      kind: "stat-sparkline",
      label: "Monthly Cost",
      meta: "at 10K users",
      dotColor: "#7ffaa8",
      value: 2847,
      prefix: "$",
      delay: 700,
      delta: { value: "+294% at 100K" },
      tabs: ["1K", "10K", "100K"],
      sparkline: {
        id: "grad-cost-scale",
        color: "#7ffaa8",
        drawDelay: 0.5,
        height: 56,
        line: "M0 48 C 45 46, 85 41, 125 34 S 205 19, 245 13 S 285 8, 300 6",
        area: "M0 48 C 45 46, 85 41, 125 34 S 205 19, 245 13 S 285 8, 300 6 L 300 56 L 0 56 Z",
        xLabels: ["1K", "10K", "100K"],
      },
    },
  },
  // 2 — Icon tile (orange): visual break
  {
    className: "mt-14 shrink-0 snap-center",
    entryY: 30,
    entryX: 0,
    entryDelay: 0.52,
    widget: { kind: "icon-tile", palette: "orange" },
  },
  // 3 — Service cost mix: how the bill splits across cloud service categories.
  {
    className: "w-[320px] shrink-0 snap-center sm:w-[400px]",
    entryX: 0,
    entryY: 44,
    floatX: 8,
    floatY: 10,
    dir: 1,
    entryDelay: 0.58,
    floatDur: 9,
    widget: {
      kind: "bars-horizontal",
      title: "Service Cost Mix",
      meta: "by category",
      rows: [
        { label: "AI / LLM API", value: 42, color: "#7ffaa8" },
        { label: "Hosting", value: 22, color: "#377FEA" },
        { label: "Database", value: 16, color: "#FB3C4F" },
        { label: "Storage", value: 10, color: "#6937EA" },
        { label: "Payments", value: 10, color: "#ebc346" },
      ],
    },
  },
  // 4 — Services identified: how many cloud services the AI mapped, by layer.
  {
    className: "w-[320px] shrink-0 snap-center sm:w-[400px]",
    entryX: 0,
    entryY: 48,
    floatX: 9,
    floatY: 11,
    dir: 1,
    entryDelay: 0.76,
    floatDur: 9.5,
    widget: {
      kind: "stat-bars",
      label: "Services Identified",
      meta: "by layer",
      dotColor: "#377FEA",
      subLabel: "across 8 service categories",
      chips: ["AI", "Payments", "Hosting", "Data"],
      value: 7,
      suffix: "",
      delay: 900,
      bars: {
        heights: [30, 42, 50, 58, 65, 72, 82, 95],
        color: "#377FEA",
        highlightFrom: 6,
      },
    },
  },
  // 6 — Icon tile (purple): visual break
  {
    className: "mt-12 shrink-0 snap-center",
    entryY: 30,
    entryX: 0,
    entryDelay: 0.86,
    widget: { kind: "icon-tile", palette: "purple" },
  },
  // 7 — Optimization savings: the closer. What the user can save per month.
  {
    className: "mt-8 w-[330px] shrink-0 snap-center sm:w-[420px]",
    entryX: 50,
    entryY: 40,
    floatX: 9,
    floatY: 9,
    dir: 1,
    entryDelay: 1.02,
    floatDur: 9,
    widget: {
      kind: "stat-sparkline",
      label: "Optimization Savings",
      meta: "monthly potential",
      dotColor: "#6937EA",
      value: 1420,
      prefix: "$",
      delay: 650,
      delta: { value: "-49% of bill", positive: true },
      tabs: ["Model", "Caching", "Tier", "Arch"],
      sparkline: {
        id: "grad-save",
        color: "#6937EA",
        drawDelay: 0.4,
        line: "M0 54 C 50 50, 90 43, 130 35 S 210 21, 250 15 S 290 10, 300 8",
        area: "M0 54 C 50 50, 90 43, 130 35 S 210 21, 250 15 S 290 10, 300 8 L 300 68 L 0 68 Z",
        xLabels: ["Run 1", "Run 3", "Run 5", "Run 7"],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tech marquee
// ---------------------------------------------------------------------------

export const techStack: { name: string; sponsor?: boolean }[] = [
  { name: "Doctavian", sponsor: true },
  { name: "Nutrient", sponsor: true },
  { name: "Google Gemini" },
  { name: "Xano" },
  { name: "SerpApi" },
  { name: "Next.js" },
];

// ---------------------------------------------------------------------------
// Feature cards
// ---------------------------------------------------------------------------

export const featureCards = [
  {
    title: "AI Architecture Analysis",
    desc: "Gemini reasons over your app description, identifies every cloud service — compute, database, AI, payments, auth — and maps each to a real provider with a usage estimate per user.",
  },
  {
    title: "Cost Projection at Scale",
    desc: "Real pricing data from SerpApi powers projections from 1K to 10K to 100K users. See which service dominates your bill and where the cost curve bends before you commit to an architecture.",
  },
  {
    title: "Cost Optimization Suggestions",
    desc: "Gemini analyzes your cost breakdown and recommends specific savings — model downgrades, caching strategies, tier changes — each with an estimated percentage reduction in your monthly bill.",
  },
  {
    title: "PDF Report Generation",
    desc: "Nutrient's DWS Processor API generates a professional PDF cost report from your analysis, then the Data Extraction API parses it back to verify every field with a confidence score and audit trail.",
  },
  {
    title: "Signed Cost Reports",
    desc: "Send the PDF through Doctavian's e-signature envelope workflow for legally binding stakeholder approval. Signer receives an email, reviews, and signs — the document trail is audit-ready.",
  },
];

// ---------------------------------------------------------------------------
// Statement panel
// ---------------------------------------------------------------------------

export const statement = {
  eyebrow: "The problem",
  headline: "Cloud cost surprises kill more projects than bad code",
};

// ---------------------------------------------------------------------------
// Deep dive panels
// ---------------------------------------------------------------------------

export const deepDive = {
  primary: {
    title: "AI-Powered Service Identification",
    sub: "Gemini doesn't just list services — it reasons about your app's data flow, user interactions, and scaling characteristics to identify what you actually need and why.",
    cta: "Try the analysis",
    href: "#app",
    bullets: [
      "Natural language input — no cloud architecture knowledge required",
      "Services mapped to specific providers (AWS, GCP, Azure, Stripe, etc.)",
      "Per-user usage estimates grounded in real pricing data from SerpApi",
      "Complexity assessment and dominant cost driver identification",
    ],
  },
  sponsor: {
    title: "Doctavian E-Signature Integration",
    sub: "Cost reports are generated as PDFs and routed through Doctavian's signature envelope workflow — the same infrastructure used by enterprises for legally binding document signing.",
    cta: "See the signature flow",
    href: "#app",
    bullets: [
      "PDF report generated locally with pdfkit, uploaded to Doctavian storage",
      "Signature envelope created with positioned fields and sent via API",
      "Signer receives email from Doctavian, reviews and signs in their web UI",
      "OAuth refresh-token flow keeps the integration alive without manual token renewal",
    ],
  },
};

// ---------------------------------------------------------------------------
// Demo video section
// ---------------------------------------------------------------------------

export const demo = {
  eyebrow: "Demo",
  headline: "Watch CloudCost AI analyze an app and send a signed cost report",
  duration: "2:30",
};

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

export const architecture = {
  headline: "How the pieces fit together",
  flow: [
    "User describes app",
    "Xano → Gemini + SerpApi",
    "Cost engine projects pricing",
    "Doctavian signs the report",
  ],
  cards: [
    {
      title: "Xano Backend",
      desc: "Xano receives the analysis request, calls the Next.js API (SerpApi + Gemini), stores the result in its database, and returns the structured analysis to the frontend.",
      cta: "Xano Docs",
      href: "https://docs.xano.com",
    },
    {
      title: "Nutrient Document Engine",
      desc: "Nutrient's processor extracts structured data from the generated PDF report — field confidence scores, audit trail, and metadata for downstream processing.",
      cta: "Nutrient Docs",
      href: "https://www.nutrient.io/api/",
    },
  ],
};

// ---------------------------------------------------------------------------
// Proof
// ---------------------------------------------------------------------------

/**
 * `tech` links each entry to a name from `techStack` — the left-column pill
 * shows the tech name, creating a visual link between the marquee
 * ("built with X") and the proof ("here's what we achieved with X").
 * When `tech` is omitted the pill falls back to `label`.
 */
export const proof: {
  kind: "Output" | "Measured" | "Problem" | "Scope";
  label: string;
  tech?: string;
  headline: string;
  body: string;
  source?: string;
  statValue?: string;
  statLabel?: string;
}[] = [
  {
    kind: "Output",
    label: "Real analysis output",
    tech: "SerpApi",
    headline: "5 services identified with live SerpApi pricing",
    body: "Gemini identified Vercel, AWS S3, Gemini Pro, Supabase, and Stripe for a document-chat SaaS app — each with a provider, category, per-user usage estimate, and role. SerpApi verified live pricing for each service.",
  },
  {
    kind: "Measured",
    label: "End-to-end latency",
    tech: "Google Gemini",
    headline: "Analysis completes in under 40 seconds",
    body: "From form submission to full cost projection with optimization suggestions. Measured on a warm instance with Gemini and live SerpApi pricing lookups.",
    statValue: "39.1s",
    statLabel: "measured analysis time",
  },
  {
    kind: "Output",
    label: "Document data extraction",
    tech: "Nutrient",
    headline: "17 fields extracted from PDF with 85% confidence",
    body: "Nutrient's Data Extraction API parsed the generated cost report PDF — extracting service names, costs, and metadata with per-field confidence scores and a full audit trail (credits used, pages processed, timestamps).",
    statValue: "85.2%",
    statLabel: "average field confidence",
  },
  {
    kind: "Output",
    label: "Signature envelope sent",
    tech: "Doctavian",
    headline: "PDF cost report routed through Doctavian e-signature",
    body: "The cost report PDF was uploaded to Doctavian storage, a signature envelope was created with positioned signature and date fields, and the envelope was sent to the signer. Real envelope ID and document URN returned with consumption metrics.",
  },
  {
    kind: "Output",
    label: "Request orchestration",
    tech: "Xano",
    headline: "Xano orchestrates analysis and persists results",
    body: "Xano receives the analysis request, calls the Next.js API for Gemini + SerpApi processing, stores the structured result in its database with a record ID, and returns the analysis with a Xano persistence timestamp.",
  },
  {
    kind: "Problem",
    label: "Why this matters",
    headline: "Public cloud spend was over budget by an average of 15% in 2024",
    body: "Managing cloud spending is the top challenge for organizations two years running. Knowing the cost profile before building is the single highest-leverage decision in cloud architecture.",
    source: "https://www.flexera.com/blog/finops/cloud-computing-trends-flexera-2024-state-of-the-cloud-report/",
  },
];

export const proofNote =
  "Every figure above was measured on this build. This project has no users yet, so there are no testimonials here.";

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export const resources = [
  {
    tag: "Signature",
    title: "Doctavian API Reference",
    desc: "The signature and document generation API we integrated for e-signature workflows.",
    href: "https://developers.doctavian.com/en/get-started",
  },
  {
    tag: "PDF",
    title: "Nutrient Document API",
    desc: "PDF processing, data extraction, and viewing — used for report generation and field extraction.",
    href: "https://www.nutrient.io/api/",
  },
  {
    tag: "AI",
    title: "Google Gemini API",
    desc: "The AI model that reasons about app descriptions and identifies cloud architecture.",
    href: "https://ai.google.dev/gemini-api/docs",
  },
  {
    tag: "Data",
    title: "SerpApi Pricing Data",
    desc: "Real-time search API used to fetch live cloud pricing from provider documentation.",
    href: "https://serpapi.com",
  },
];

// ---------------------------------------------------------------------------
// Closing CTA
// ---------------------------------------------------------------------------

export const closingPhrase = "Stop guessing. Start planning.";

export const ctaCards = [
  { label: "Live demo", href: links.demo },
  { label: "GitHub repo", href: links.repo },
  { label: "Demo video", href: links.video },
  { label: "Docs", href: links.docs },
];

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const footerLinks = [
  { label: "Live demo", href: links.demo },
  { label: "GitHub", href: links.repo },
  { label: "Demo video", href: links.video },
  { label: "Docs", href: links.docs },
];

export const footer = {
  blurb: "AI-powered cloud cost intelligence for teams that build before they buy.",
  credit: `Built by ${project.author} for ${project.hackathon}`,
};

// ---------------------------------------------------------------------------
// App slot
// ---------------------------------------------------------------------------

export const appSlot = {
  title: "CloudCost AI",
  inputLabel: "Describe your application",
  inputPlaceholder: "e.g. A SaaS app where users upload documents, chat with AI about them, and pay for premium features",
  runLabel: "Analyze",
  loadingLabel: "Analyzing architecture and projecting costs...",
  resultTitle: "Cost Analysis Complete",
  resultBody: "Your cost report is ready for review and signature.",
  emptyWarning: "Please describe your app first",
};
