import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Optimization, CostProjection } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are CloudCost AI's optimization engine. Given a cost projection for an app's API stack, suggest specific, actionable cost optimizations with quantified dollar savings.

For each optimization, provide:
1. A clear title (e.g. "Switch 80% of queries to Gemini Flash")
2. A description explaining what to change and why
3. The estimated monthly savings in dollars
4. The savings percentage relative to the affected services' cost
5. The implementation effort (low, medium, high)
6. Which services are affected
7. A category (model-downgrade, caching, batching, tier-change, right-sizing, architecture)

Common optimization strategies:
- Model downgrade: Use cheaper AI models for simpler queries (e.g. Gemini Flash instead of Pro for 80% of traffic)
- Caching: Cache AI responses for common queries to reduce API calls
- Batching: Use batch APIs for non-real-time workloads (often 50% cheaper)
- Tier changes: Move to reserved instances or committed-use discounts
- Right-sizing: Reduce storage tier (S3 Standard → S3 Infrequent Access) for cold data
- Architecture: Combine services, remove unused ones, or restructure for efficiency

Return JSON in EXACTLY this format:
{
  "optimizations": [
    {
      "id": "opt-1",
      "title": "<short title>",
      "description": "<2-3 sentence explanation>",
      "savingsPerMonth": <number in dollars>,
      "savingsPercentage": <number 0-100>,
      "category": "<category>",
      "effort": "low" | "medium" | "high",
      "affectedServices": ["<service names>"]
    }
  ]
}

Rules:
- Suggest 3-5 optimizations, ordered by savings amount (highest first)
- Be realistic about savings — don't claim 90% from a single change
- The total savings should be achievable, not theoretical maximums
- Return ONLY the JSON, no markdown formatting, no code fences`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projection, appDescription }: { projection: CostProjection; appDescription: string } = body;

    if (!projection || !projection.scales) {
      return NextResponse.json({ error: "Cost projection is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    // Use the 100k user scale for optimization context
    const scale100k = projection.scales.find((s) => s.users === 100000) ?? projection.scales[projection.scales.length - 1];

    const costContext = scale100k.services
      .map((s) => `- ${s.serviceName}: ${s.category} — $${s.monthlyCost.toFixed(2)}/mo (${s.percentage.toFixed(1)}% of total)`)
      .join("\n");

    const prompt = `App description: ${appDescription}

Current monthly costs at 100,000 users (total: $${scale100k.totalCost.toFixed(2)}/mo):
${costContext}

Dominant cost driver: ${projection.dominantService}

Suggest specific optimizations to reduce this bill. Return the JSON.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    let parsed: { optimizations: Optimization[] } | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent([
          { text: SYSTEM_PROMPT },
          { text: prompt },
        ]);

        const responseText = result.response.text();
        let jsonText = responseText.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        // Extract JSON block if embedded in prose
        const jsonStart = jsonText.indexOf("{");
        const jsonEnd = jsonText.lastIndexOf("}");
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
        }

        const candidate = JSON.parse(jsonText) as { optimizations: Optimization[] };
        if (candidate.optimizations && Array.isArray(candidate.optimizations)) {
          parsed = candidate;
          break;
        }
        lastError = "Missing optimizations array";
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Parse error";
      }
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: `Optimization failed after 3 attempts: ${lastError}` },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Optimization error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Optimization failed: ${message}` },
      { status: 500 }
    );
  }
}
