import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ArchitectureAnalysis, ApiService } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are CloudCost AI, an expert cloud architect and FinOps consultant. Your job is to analyze a natural-language app description and determine which API services the app needs, estimate per-user usage patterns, and return a structured JSON response.

For each service, you must:
1. Identify the specific API/service (e.g. "Gemini AI", "Stripe", "SendGrid", "AWS S3", "Vercel")
2. Determine its role in the app
3. Estimate realistic per-user-per-month usage based on the app type
4. Assign the correct pricing category

Use ONLY these service IDs and pricing structures (match the service to the closest one):
- gemini-flash: Google Gemini Flash (AI, per 1M tokens, input $0.075, output $0.30)
- gemini-pro: Google Gemini Pro (AI, per 1M tokens, input $1.25, output $5.00)
- stripe: Stripe payments (per transaction, 2.9% + $0.30)
- sendgrid: SendGrid email (per email, ~$0.00089)
- aws-s3: AWS S3 storage (per GB-month, $0.023)
- vercel: Vercel hosting (flat $20/mo)
- supabase: Supabase database (flat $25/mo)
- twilio: Twilio SMS (per message, $0.0079)
- clerk: Clerk auth (per MAU, $0.02 after 10K free)
- algolia: Algolia search (per 1K searches, $0.50)

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
        "description": "<pricing description>"
      }
    }
  ]
}

PRICING FIELD RULES (critical — the cost engine depends on these):
- "flatRate": Use ONLY for services with a fixed monthly cost regardless of usage.
  Examples: Vercel ($20/mo), Supabase ($25/mo). Set inputRate and outputRate to null.
- "inputRate" + "outputRate": Use ONLY for AI models with per-1M-token pricing.
  Example: Gemini Pro → inputRate: 1.25, outputRate: 5.0. Set flatRate to null.
- "inputRate" only (outputRate null): Use for per-unit usage-based services.
  Examples: S3 → inputRate: 0.023 (per GB), Stripe → inputRate: 0.30 (per transaction),
  SendGrid → inputRate: 0.00089 (per email), Twilio → inputRate: 0.0079 (per SMS),
  Clerk → inputRate: 0.02 (per MAU), Algolia → inputRate: 0.0005 (per search).
  Set flatRate and outputRate to null.
- "freeTier": The number of free units per month (e.g. Clerk: 10000 MAU free). null if no free tier.

Rules:
- Always include at least 3 services and at most 7
- Always include a hosting service (vercel) and at least one AI service
- Be realistic about usage: a chat app user might send 50 messages/day with 2500 tokens each; a document app user might upload 50MB/month
- The perUserPerMonth for AI services should be in TOKENS (not requests)
- The perUserPerMonth for Stripe should be in TRANSACTIONS
- The perUserPerMonth for SendGrid should be in EMAILS
- The perUserPerMonth for S3 should be in GB
- The perUserPerMonth for Twilio should be in MESSAGES
- The perUserPerMonth for Clerk should be in MAU (always 1)
- The perUserPerMonth for Algolia should be in SEARCHES
- Return ONLY the JSON, no markdown formatting, no code fences`;

const MAX_RETRIES = 3;

function parseGeminiResponse(text: string): ArchitectureAnalysis | null {
  let jsonText = text.trim();
  // Strip markdown code fences if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  // Also handle cases where JSON is embedded in prose — extract the first { ... } block
  const jsonStart = jsonText.indexOf("{");
  const jsonEnd = jsonText.lastIndexOf("}");
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonText) as ArchitectureAnalysis;
    // Validate required structure
    if (!parsed.services || !Array.isArray(parsed.services) || parsed.services.length === 0) {
      return null;
    }
    // Sanitize: ensure pricing fields are numbers or null (not strings)
    parsed.services = parsed.services.map((s) => ({
      ...s,
      pricing: {
        unit: s.pricing?.unit ?? "",
        inputRate: s.pricing?.inputRate ?? null,
        outputRate: s.pricing?.outputRate ?? null,
        flatRate: s.pricing?.flatRate ?? null,
        freeTier: s.pricing?.freeTier ?? null,
        description: s.pricing?.description ?? "",
      },
      usageEstimate: {
        metric: s.usageEstimate?.metric ?? "requests",
        perUserPerMonth: Number(s.usageEstimate?.perUserPerMonth) || 0,
        description: s.usageEstimate?.description ?? "",
      },
    }));
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    let analysis: ArchitectureAnalysis | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: `Analyze this app description and return the JSON:\n\n${description}` },
        ]);

        const responseText = result.response.text();
        analysis = parseGeminiResponse(responseText);

        if (analysis) {
          break; // success
        }

        lastError = "AI returned malformed JSON";
        // On retry, add a stronger instruction
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Unknown error";
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    }

    if (!analysis) {
      return NextResponse.json(
        { error: `Analysis failed after ${MAX_RETRIES} attempts: ${lastError}. Please try again.` },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
