// Core types for CloudCost AI

// A single API service identified by the AI from the app description
export interface ApiService {
  id: string;
  name: string;
  provider: string;
  category: "ai" | "payments" | "communication" | "storage" | "hosting" | "database" | "auth" | "search";
  role: string; // what this service does in the user's app
  icon: string; // lucide icon name
  // Per-user usage estimate (the AI reasons about this from the app description)
  usageEstimate: {
    metric: string; // e.g. "tokens", "transactions", "emails", "GB", "requests"
    perUserPerMonth: number;
    description: string; // plain English explanation of the usage pattern
  };
  // Pricing model
  pricing: {
    unit: string; // e.g. "per 1M tokens", "per transaction", "per email", "per GB-month"
    inputRate?: number; // for AI models (per unit)
    outputRate?: number; // for AI models (per unit)
    flatRate?: number; // for flat-rate services (per month)
    freeTier?: number; // free tier allowance per month
    description: string;
  };
}

// The full analysis result from Gemini
export interface ArchitectureAnalysis {
  appDescription: string;
  services: ApiService[];
  summary: string; // AI's summary of the architecture
  estimatedComplexity: "simple" | "moderate" | "complex";
}

// Cost calculation result for a single service at a single scale
export interface ServiceCost {
  serviceId: string;
  serviceName: string;
  category: string;
  monthlyCost: number;
  percentage: number;
  breakdown: {
    label: string;
    value: number;
  }[];
}

// Cost projection at multiple user scales
export interface CostProjection {
  scales: { users: number; label: string; totalCost: number; services: ServiceCost[] }[];
  dominantService: string;
  totalMonthlyAt100k: number;
}

// AI optimization suggestion
export interface Optimization {
  id: string;
  title: string;
  description: string;
  savingsPerMonth: number;
  savingsPercentage: number;
  category: string; // e.g. "model-downgrade", "caching", "batching", "tier-change"
  effort: "low" | "medium" | "high";
  affectedServices: string[];
}

// The full result object passed around the app
export interface AnalysisResult {
  analysis: ArchitectureAnalysis;
  projection: CostProjection;
  optimizations: Optimization[];
}

// Loading state for the analysis flow
export type AnalysisState = "idle" | "analyzing" | "projecting" | "optimizing" | "done" | "error";
