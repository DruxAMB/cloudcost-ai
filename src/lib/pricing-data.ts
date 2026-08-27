// Pricing data sourced from public provider pricing pages.
// All prices are in USD, last verified 2026-08-26.
// This is a cached snapshot — not a live API call — for demo reliability.
// In production, this would be refreshed periodically from provider APIs.

export const PRICING_SOURCES = {
  gemini: "https://ai.google.dev/pricing",
  stripe: "https://stripe.com/pricing",
  sendgrid: "https://sendgrid.com/pricing",
  awsS3: "https://aws.amazon.com/s3/pricing/",
  vercel: "https://vercel.com/pricing",
  twilio: "https://www.twilio.com/en/pricing",
  openai: "https://openai.com/api/pricing/",
  supabase: "https://supabase.com/pricing",
  neon: "https://neon.tech/pricing",
  clerk: "https://clerk.com/pricing",
  algolia: "https://www.algolia.com/pricing",
};

// Per-unit pricing for common API services
// Rates are per the unit specified (e.g. per 1M tokens, per transaction, per email)
export const UNIT_PRICING = {
  // AI Models (per 1M tokens)
  geminiFlash: {
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    contextWindow: "1M tokens",
    source: PRICING_SOURCES.gemini,
  },
  geminiPro: {
    inputPer1M: 1.25,
    outputPer1M: 5.0,
    contextWindow: "2M tokens",
    source: PRICING_SOURCES.gemini,
  },
  geminiFlashLite: {
    inputPer1M: 0.0375,
    outputPer1M: 0.15,
    contextWindow: "1M tokens",
    source: PRICING_SOURCES.gemini,
  },
  gpt4o: {
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    contextWindow: "128K tokens",
    source: PRICING_SOURCES.openai,
  },
  gpt4oMini: {
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    contextWindow: "128K tokens",
    source: PRICING_SOURCES.openai,
  },
  // Payments (per transaction)
  stripe: {
    percentage: 0.029, // 2.9%
    fixedPerTransaction: 0.3, // $0.30
    source: PRICING_SOURCES.stripe,
  },
  // Email (per email)
  sendgrid: {
    perEmail: 0.00089, // ~$89/100K emails on Essentials 100K plan
    source: PRICING_SOURCES.sendgrid,
  },
  // Storage (per GB-month)
  awsS3: {
    perGBMonth: 0.023, // Standard storage, first 50TB
    perRequest: 0.0005, // per 1K PUT/GET requests
    source: PRICING_SOURCES.awsS3,
  },
  // SMS (per message)
  twilio: {
    perSMS: 0.0079, // US SMS
    source: PRICING_SOURCES.twilio,
  },
  // Hosting (flat monthly)
  vercel: {
    proPlan: 20, // per month
    source: PRICING_SOURCES.vercel,
  },
  // Database (flat monthly)
  supabase: {
    proPlan: 25, // per month
    source: PRICING_SOURCES.supabase,
  },
  neon: {
    launchPlan: 19, // per month
    source: PRICING_SOURCES.neon,
  },
  // Auth (per MAU)
  clerk: {
    perMAU: 0.02, // after 10K free MAUs
    freeMAU: 10000,
    source: PRICING_SOURCES.clerk,
  },
  // Search (per 1K operations)
  algolia: {
    per1KSearches: 0.5, // Build plan
    source: PRICING_SOURCES.algolia,
  },
} as const;

// Helper: calculate cost for a service at a given user count
export function calculateServiceCost(
  category: string,
  usagePerUserPerMonth: number,
  userCount: number,
  pricing: {
    inputRate?: number;
    outputRate?: number;
    flatRate?: number;
    freeTier?: number;
    unit: string;
  }
): { total: number; breakdown: { label: string; value: number }[] } {
  const totalUsage = usagePerUserPerMonth * userCount;

  if (pricing.flatRate) {
    return {
      total: pricing.flatRate,
      breakdown: [{ label: "Flat monthly rate", value: pricing.flatRate }],
    };
  }

  if (pricing.inputRate !== undefined && pricing.outputRate !== undefined) {
    // AI model: split usage into input (60%) and output (40%) tokens
    const inputTokens = totalUsage * 0.6;
    const outputTokens = totalUsage * 0.4;
    const inputCost = (inputTokens / 1_000_000) * pricing.inputRate;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputRate;
    const freeTierDiscount = pricing.freeTier
      ? Math.min(inputCost + outputCost, (pricing.freeTier / 1_000_000) * (pricing.inputRate + pricing.outputRate))
      : 0;
    return {
      total: inputCost + outputCost - freeTierDiscount,
      breakdown: [
        { label: "Input tokens", value: inputCost },
        { label: "Output tokens", value: outputCost },
        ...(freeTierDiscount > 0 ? [{ label: "Free tier discount", value: -freeTierDiscount }] : []),
      ],
    };
  }

  // Per-unit pricing (transactions, emails, GB, etc.)
  const grossCost = totalUsage * (pricing.inputRate ?? 0);
  const freeTierDiscount = pricing.freeTier ? Math.min(grossCost, pricing.freeTier * (pricing.inputRate ?? 0)) : 0;
  return {
    total: grossCost - freeTierDiscount,
    breakdown: [
      { label: `Usage (${totalUsage.toLocaleString()} units)`, value: grossCost },
      ...(freeTierDiscount > 0 ? [{ label: "Free tier discount", value: -freeTierDiscount }] : []),
    ],
  };
}

// Format currency for display
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  if (amount >= 1) return `$${amount.toFixed(2)}`;
  return `$${amount.toFixed(4)}`;
}
