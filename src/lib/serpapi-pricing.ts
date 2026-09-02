import { NextRequest } from "next/server";

/**
 * SerpApi integration: fetches real-time pricing data from Google search results.
 * This replaces the hardcoded pricing-data.ts with live data sourced from the web.
 *
 * Sponsor: SerpApi: Best AI Use Case ($3,000 prize)
 * Integration: AI + live search data to improve cost prediction accuracy
 */

export interface SerpApiResult {
  title: string;
  link: string;
  snippet: string;
}

export interface PricingSearchResult {
  serviceId: string;
  serviceName: string;
  query: string;
  results: SerpApiResult[];
  topSnippet: string;
  source: string;
  searchedAt: string;
}

// The services we search for, mapped to search queries that return pricing pages
const SERVICE_QUERIES: { id: string; name: string; query: string }[] = [
  { id: "gemini-flash", name: "Google Gemini Flash", query: "Google Gemini Flash API pricing per 1M tokens 2026" },
  { id: "gemini-pro", name: "Google Gemini Pro", query: "Google Gemini Pro API pricing per 1M tokens 2026" },
  { id: "stripe", name: "Stripe", query: "Stripe pricing per transaction 2026" },
  { id: "sendgrid", name: "SendGrid", query: "SendGrid pricing per email 2026" },
  { id: "aws-s3", name: "AWS S3", query: "AWS S3 pricing per GB 2026" },
  { id: "vercel", name: "Vercel", query: "Vercel pricing plans Pro 2026" },
  { id: "supabase", name: "Supabase", query: "Supabase pricing Pro plan 2026" },
  { id: "twilio", name: "Twilio", query: "Twilio SMS pricing per message 2026" },
  { id: "clerk", name: "Clerk", query: "Clerk auth pricing per MAU 2026" },
  { id: "algolia", name: "Algolia", query: "Algolia pricing per search 2026" },
];

/**
 * Search SerpApi for a single service's pricing.
 * Returns the top organic results with snippets containing pricing data.
 */
async function searchServicePricing(
  apiKey: string,
  serviceId: string,
  serviceName: string,
  query: string
): Promise<PricingSearchResult> {
  const url = `https://serpapi.com/search?api_key=${apiKey}&engine=google&q=${encodeURIComponent(query)}&num=5`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`SerpApi returned ${response.status} for ${serviceName}`);
  }

  const data = await response.json();
  const organicResults: SerpApiResult[] = (data.organic_results || []).slice(0, 5).map((r: {
    title: string; link: string; snippet?: string;
  }) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet || "",
  }));

  const topSnippet = organicResults.length > 0
    ? organicResults.map((r) => `${r.title}: ${r.snippet}`).join(" | ")
    : "No pricing data found";

  return {
    serviceId,
    serviceName,
    query,
    results: organicResults,
    topSnippet,
    source: organicResults[0]?.link || "",
    searchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch real-time pricing data for all known services via SerpApi.
 * Searches are run in parallel for speed.
 * Returns a formatted string suitable for injection into the Gemini prompt.
 */
export async function fetchLivePricingData(apiKey: string): Promise<{
  pricingContext: string;
  results: PricingSearchResult[];
  errors: string[];
}> {
  const results: PricingSearchResult[] = [];
  const errors: string[] = [];

  // Run all searches in parallel
  const searchPromises = SERVICE_QUERIES.map(async (sq) => {
    try {
      const result = await searchServicePricing(apiKey, sq.id, sq.name, sq.query);
      results.push(result);
    } catch (err) {
      errors.push(`${sq.name}: ${err instanceof Error ? err.message : "search failed"}`);
    }
  });

  await Promise.allSettled(searchPromises);

  // Build a context string for the Gemini prompt
  const pricingContext = results
    .map((r) => {
      const snippets = r.results
        .slice(0, 3)
        .map((res) => `- ${res.title}: ${res.snippet}`)
        .join("\n");
      return `[${r.serviceName}] (searched: ${r.searchedAt})\n${snippets}`;
    })
    .join("\n\n");

  return { pricingContext, results, errors };
}

/**
 * Build the dynamic pricing section for the Gemini prompt.
 * Replaces the hardcoded pricing list with real-time data from SerpApi.
 */
export function buildDynamicPricingPrompt(livePricing: string): string {
  return `You are CloudCost AI, an expert cloud architect and FinOps consultant. Your job is to analyze a natural-language app description and determine which API services the app needs, estimate per-user usage patterns, and return a structured JSON response.

For each service, you must:
1. Identify the specific API/service (e.g. "Gemini AI", "Stripe", "SendGrid", "AWS S3", "Vercel")
2. Determine its role in the app
3. Estimate realistic per-user-per-month usage based on the app type
4. Assign the correct pricing category

Use ONLY these service IDs and pricing structures. The pricing data below was fetched in real-time from Google search results via SerpApi. Use these actual prices, not your training data:

--- LIVE PRICING DATA (fetched via SerpApi) ---
${livePricing}
--- END LIVE PRICING DATA ---

Match the service to the closest one from the list above. Use the actual pricing numbers from the live data. If the live data contains a price range, use the standard/most common rate.

Return JSON in EXACTLY this format:
{
  "appDescription": "<the original description>",
  "summary": "<2-3 sentence summary of the architecture>",
  "estimatedComplexity": "simple" | "moderate" | "complex",
  "services": [
    {
      "id": "<service-id from the list above>",
      "name": "<display name>",
      "provider": "<company name>",
      "category": "ai" | "payments" | "communication" | "storage" | "hosting" | "database" | "auth" | "search",
      "role": "<what this service does in the user's app>",
      "icon": "<lucide-react icon name>",
      "usageEstimate": {
        "metric": "<tokens|transactions|emails|GB|messages|MAU|searches|requests>",
        "perUserPerMonth": <number>,
        "description": "<plain English explanation of the usage pattern>"
      },
      "pricing": {
        "unit": "<pricing unit description>",
        "inputRate": <number or null>,
        "outputRate": <number or null>,
        "flatRate": <number or null>,
        "freeTier": <number or null>,
        "description": "<pricing description based on the live data>"
      }
    }
  ]
}

PRICING FIELD RULES (critical: the cost engine depends on these):
- "flatRate": Use ONLY for services with a fixed monthly cost regardless of usage.
  Examples: Vercel, Supabase. Set inputRate and outputRate to null.
- "inputRate" + "outputRate": Use ONLY for AI models with per-1M-token pricing.
  Set flatRate to null.
- "inputRate" only (outputRate null): Use for per-unit usage-based services.
  Examples: S3 (per GB), Stripe (per transaction), SendGrid (per email), Twilio (per SMS),
  Clerk (per MAU), Algolia (per search). Set flatRate and outputRate to null.
- "freeTier": The number of free units per month. null if no free tier.

Rules:
- Always include at least 3 services and at most 7
- Always include a hosting service (vercel) and at least one AI service
- Be realistic about usage: a chat app user might send 50 messages/day with 2500 tokens each
- The perUserPerMonth for AI services should be in TOKENS (not requests)
- Return ONLY the JSON, no markdown formatting, no code fences`;
}
