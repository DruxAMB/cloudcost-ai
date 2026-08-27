import type { ArchitectureAnalysis, CostProjection, ServiceCost, ApiService } from "./types";

const USER_SCALES = [
  { users: 1_000, label: "1K users" },
  { users: 10_000, label: "10K users" },
  { users: 100_000, label: "100K users" },
];

export function calculateCostProjection(analysis: ArchitectureAnalysis): CostProjection {
  const scales = USER_SCALES.map(({ users, label }) => {
    const services: ServiceCost[] = analysis.services.map((service: ApiService) => {
      const cost = computeServiceCost(service, users);
      return {
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        monthlyCost: cost.total,
        percentage: 0, // filled in after total is known
        breakdown: cost.breakdown,
      };
    });

    const totalCost = services.reduce((sum, s) => sum + s.monthlyCost, 0);
    services.forEach((s) => {
      s.percentage = totalCost > 0 ? (s.monthlyCost / totalCost) * 100 : 0;
    });

    // Sort services by cost descending
    services.sort((a, b) => b.monthlyCost - a.monthlyCost);

    return { users, label, totalCost, services };
  });

  const scale100k = scales[scales.length - 1];
  const dominantService = scale100k.services[0]?.serviceName ?? "Unknown";

  return {
    scales,
    dominantService,
    totalMonthlyAt100k: scale100k.totalCost,
  };
}

function computeServiceCost(
  service: ApiService,
  userCount: number
): { total: number; breakdown: { label: string; value: number }[] } {
  const { pricing, usageEstimate } = service;
  const totalUsage = usageEstimate.perUserPerMonth * userCount;

  // Flat-rate services (hosting, database)
  if (pricing.flatRate !== undefined && pricing.flatRate !== null) {
    return {
      total: pricing.flatRate,
      breakdown: [{ label: "Flat monthly rate", value: pricing.flatRate }],
    };
  }

  // AI models (input + output rates per 1M tokens)
  if (pricing.inputRate !== undefined && pricing.outputRate !== undefined) {
    const inputTokens = totalUsage * 0.6;
    const outputTokens = totalUsage * 0.4;
    const inputCost = (inputTokens / 1_000_000) * pricing.inputRate;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputRate;
    const grossTotal = inputCost + outputCost;

    const freeTierDiscount =
      pricing.freeTier !== undefined && pricing.freeTier !== null
        ? Math.min(
            grossTotal,
            (pricing.freeTier / 1_000_000) * (pricing.inputRate + pricing.outputRate)
          )
        : 0;

    return {
      total: Math.max(0, grossTotal - freeTierDiscount),
      breakdown: [
        { label: `Input tokens (${formatTokens(inputTokens)})`, value: inputCost },
        { label: `Output tokens (${formatTokens(outputTokens)})`, value: outputCost },
        ...(freeTierDiscount > 0
          ? [{ label: "Free tier discount", value: -freeTierDiscount }]
          : []),
      ],
    };
  }

  // Per-unit services (transactions, emails, GB, messages, etc.)
  const rate = pricing.inputRate ?? 0;
  const grossCost = totalUsage * rate;
  const freeTierDiscount =
    pricing.freeTier !== undefined && pricing.freeTier !== null
      ? Math.min(grossCost, pricing.freeTier * rate)
      : 0;

  return {
    total: Math.max(0, grossCost - freeTierDiscount),
    breakdown: [
      { label: `Usage (${totalUsage.toLocaleString()} ${usageEstimate.metric})`, value: grossCost },
      ...(freeTierDiscount > 0
        ? [{ label: "Free tier discount", value: -freeTierDiscount }]
        : []),
    ],
  };
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) return `${(tokens / 1_000_000_000).toFixed(1)}B`;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return tokens.toFixed(0);
}
