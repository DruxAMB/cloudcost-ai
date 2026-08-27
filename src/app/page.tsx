"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Download,
  TrendingDown,
  Zap,
  Server,
  DollarSign,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Cloud,
  Cpu,
  Mail,
  CreditCard,
  Database,
  HardDrive,
  MessageSquare,
  Search,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  ArchitectureAnalysis,
  CostProjection,
  Optimization,
  AnalysisState,
  ServiceCost,
} from "@/lib/types";
import { calculateCostProjection } from "@/lib/cost-engine";
import { formatCurrency } from "@/lib/pricing-data";

const EXAMPLE_PROMPT =
  "A SaaS app where users upload documents, chat with AI about them, and pay for premium features";

const CATEGORY_COLORS: Record<string, string> = {
  ai: "var(--chart-1)",
  payments: "var(--chart-2)",
  communication: "var(--chart-3)",
  storage: "var(--chart-4)",
  hosting: "var(--chart-5)",
  database: "var(--chart-3)",
  auth: "var(--chart-4)",
  search: "var(--chart-2)",
};

const CATEGORY_ICONS: Record<string, typeof Cloud> = {
  ai: Sparkles,
  payments: CreditCard,
  communication: Mail,
  storage: HardDrive,
  hosting: Globe,
  database: Database,
  auth: Lock,
  search: Search,
};

export default function Home() {
  const [description, setDescription] = useState(EXAMPLE_PROMPT);
  const [state, setState] = useState<AnalysisState>("idle");
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis | null>(null);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showOptimizations, setShowOptimizations] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!description.trim()) {
      toast.error("Please describe your app first");
      return;
    }

    setState("analyzing");
    setAnalysis(null);
    setProjection(null);
    setOptimizations([]);
    setOptimizeError(null);
    setSelectedService(null);
    setShowOptimizations(false);

    // 90-second timeout — if Gemini is unreachable, show error instead of hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    try {
      // Step 1: Analyze architecture
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        signal: controller.signal,
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "Analysis failed");
      }

      const analysisResult: ArchitectureAnalysis = await analyzeRes.json();
      setAnalysis(analysisResult);

      // Step 2: Calculate cost projection
      setState("projecting");
      const costProjection = calculateCostProjection(analysisResult);
      setProjection(costProjection);

      // Step 3: Get optimizations (non-critical — analysis still shows if this fails)
      setState("optimizing");
      try {
        const optimizeRes = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projection: costProjection,
            appDescription: description,
          }),
          signal: controller.signal,
        });

        if (optimizeRes.ok) {
          const optimizeResult = await optimizeRes.json();
          setOptimizations(optimizeResult.optimizations || []);
        } else {
          setOptimizeError("Optimization suggestions are temporarily unavailable. Your cost analysis is still complete.");
        }
      } catch {
        setOptimizeError("Optimization suggestions are temporarily unavailable. Your cost analysis is still complete.");
      }

      setState("done");
    } catch (error) {
      console.error("Analysis error:", error);
      setState("error");
      const msg = error instanceof DOMException && error.name === "AbortError"
        ? "The request timed out. The AI service may be slow — please try again."
        : error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [description]);

  const handleReset = useCallback(() => {
    setState("idle");
    setAnalysis(null);
    setProjection(null);
    setOptimizations([]);
    setOptimizeError(null);
    setSelectedService(null);
    setShowOptimizations(false);
  }, []);

  const handleExport = useCallback(() => {
    if (!analysis || !projection) return;

    const scale100k = projection.scales.find((s) => s.users === 100000);
    const totalSavings = optimizations.reduce((sum, o) => sum + o.savingsPerMonth, 0);

    const markdown = `# CloudCost AI — Cost Analysis Report

## App Description
${analysis.appDescription}

## Architecture Summary
${analysis.summary}

**Estimated complexity:** ${analysis.estimatedComplexity}

## Services Identified
${analysis.services
  .map(
    (s) =>
      `- **${s.name}** (${s.provider}) — ${s.role}\n  Usage: ${s.usageEstimate.perUserPerMonth.toLocaleString()} ${s.usageEstimate.metric}/user/month`
  )
  .join("\n")}

## Cost Projection

| Scale | Monthly Cost |
|---|---|
${projection.scales.map((s) => `| ${s.label} | ${formatCurrency(s.totalCost)}/mo |`).join("\n")}

### Cost Breakdown at 100K Users
${
  scale100k
    ? scale100k.services
        .map(
          (s) =>
            `- **${s.serviceName}**: ${formatCurrency(s.monthlyCost)}/mo (${s.percentage.toFixed(1)}%)`
        )
        .join("\n")
    : ""
}

**Dominant cost driver:** ${projection.dominantService}

## Optimization Suggestions
${
  optimizations.length > 0
    ? optimizations
        .map(
          (o) =>
            `### ${o.title}\n${o.description}\n\n- **Savings:** ${formatCurrency(o.savingsPerMonth)}/mo (${o.savingsPercentage.toFixed(0)}%)\n- **Effort:** ${o.effort}\n- **Category:** ${o.category}\n- **Affected services:** ${o.affectedServices.join(", ")}`
        )
        .join("\n\n")
    : "No optimizations suggested."
}

## Total Potential Savings
${formatCurrency(totalSavings)}/month

---
*Generated by CloudCost AI — ${new Date().toISOString()}*
*Pricing data sourced from public provider pricing pages, verified 2026-08-26*
`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloudcost-ai-report.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported as markdown");
  }, [analysis, projection, optimizations]);

  const isLoading = state === "analyzing" || state === "projecting" || state === "optimizing";

  return (
    <main className="flex-1 flex flex-col" aria-live="polite" aria-atomic="false">
      {/* Hero / Landing section — only visible when idle */}
      {state === "idle" && (
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Cloud className="w-5 h-5" aria-hidden="true" />
            </div>
            <span className="text-xl font-semibold tracking-tight">CloudCost AI</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">
            Describe your app.
            <br />
            <span className="text-muted-foreground">Predict your API costs.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-center mb-8 max-w-2xl">
            AI reasons about your full API stack — cloud, AI tokens, payments, email, and more —
            and shows your costs at 1K, 10K, and 100K users. Before you deploy.
          </p>

          <div className="w-full max-w-2xl">
            <label htmlFor="app-description" className="block text-sm font-medium mb-2">
              Describe your app in plain English
            </label>
            <textarea
              id="app-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. A SaaS app where users upload documents, chat with AI about them, and pay for premium features"
              className="w-full min-h-[120px] rounded-lg border border-input bg-background px-4 py-3 text-base resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
            />
            <Button
              onClick={handleAnalyze}
              size="lg"
              className="w-full mt-4 h-12 text-base"
              disabled={!description.trim()}
            >
              <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
              Analyze architecture
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-3xl">
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted mb-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-medium text-sm mb-1">1. Describe</h3>
              <p className="text-sm text-muted-foreground">
                Plain English — no architecture diagrams needed
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted mb-3">
                <Server className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-medium text-sm mb-1">2. Reason</h3>
              <p className="text-sm text-muted-foreground">
                AI identifies your API stack and usage patterns
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted mb-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-medium text-sm mb-1">3. Predict</h3>
              <p className="text-sm text-muted-foreground">
                See costs at scale and cut your bill before deploying
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Loading state */}
      {isLoading && <LoadingState state={state} />}

      {/* Error state */}
      {state === "error" && (
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Analysis failed</h2>
          <p className="text-muted-foreground text-center mb-6">
            Something went wrong while analyzing your app. This is usually a temporary issue with
            the AI service. Please try again.
          </p>
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            Try again
          </Button>
        </section>
      )}

      {/* Results — shown when analysis is done */}
      {state === "done" && analysis && projection && (
        <ResultsView
          analysis={analysis}
          projection={projection}
          optimizations={optimizations}
          optimizeError={optimizeError}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          showOptimizations={showOptimizations}
          setShowOptimizations={setShowOptimizations}
          onExport={handleExport}
          onReset={handleReset}
        />
      )}
    </main>
  );
}

// --- Loading State Component ---

function LoadingState({ state }: { state: AnalysisState }) {
  const steps = [
    { key: "analyzing", label: "Identifying services", icon: Sparkles },
    { key: "projecting", label: "Estimating usage patterns", icon: Cpu },
    { key: "optimizing", label: "Fetching pricing data", icon: DollarSign },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === state);

  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
        <span className="text-lg font-medium">AI is reasoning about your architecture</span>
      </div>

      <div className="w-full max-w-md space-y-3" role="status" aria-live="polite">
        {steps.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isCurrent ? "border-primary bg-primary/5" : isDone ? "border-border bg-muted/30" : "border-border opacity-50"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0">
                {isDone ? (
                  <span className="text-primary text-sm font-bold" aria-hidden="true">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
              <span className={`text-sm ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                {step.label}
                {isDone && " — done"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skeleton preview of results */}
      <div className="w-full max-w-2xl mt-8 space-y-4" aria-hidden="true">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg w-full" />
      </div>
    </section>
  );
}

// --- Results View Component ---

function ResultsView({
  analysis,
  projection,
  optimizations,
  optimizeError,
  selectedService,
  setSelectedService,
  showOptimizations,
  setShowOptimizations,
  onExport,
  onReset,
}: {
  analysis: ArchitectureAnalysis;
  projection: CostProjection;
  optimizations: Optimization[];
  optimizeError: string | null;
  selectedService: string | null;
  setSelectedService: (id: string | null) => void;
  showOptimizations: boolean;
  setShowOptimizations: (v: boolean) => void;
  onExport: () => void;
  onReset: () => void;
}) {
  const totalSavings = optimizations.reduce((sum, o) => sum + o.savingsPerMonth, 0);
  const scale100k = projection.scales.find((s) => s.users === 100000);
  const selectedServiceData = scale100k?.services.find((s) => s.serviceId === selectedService);

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Back to home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <Cloud className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="font-semibold">CloudCost AI</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onReset} variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" aria-hidden="true" />
            New analysis
          </Button>
          <Button onClick={onExport} size="sm">
            <Download className="w-4 h-4 mr-1" aria-hidden="true" />
            Export report
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <Card className="p-5 md:p-6 mb-6">
        <p className="text-sm text-muted-foreground mb-1">Architecture summary</p>
        <p className="text-base md:text-lg mb-3">{analysis.summary}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {analysis.services.length} services
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {analysis.estimatedComplexity} complexity
          </Badge>
          <Badge variant="secondary">
            Dominant cost: {projection.dominantService}
          </Badge>
        </div>
      </Card>

      {/* Service cards grid */}
      <h2 className="text-lg font-semibold mb-3">Identified services</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {analysis.services.map((service) => {
          const Icon = CATEGORY_ICONS[service.category] ?? Server;
          const costAt100k = scale100k?.services.find(
            (s) => s.serviceId === service.id
          );
          const isSelected = selectedService === service.id;
          return (
            <Card
              key={service.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedService(isSelected ? null : service.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedService(isSelected ? null : service.id);
                }
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${CATEGORY_COLORS[service.category]} 15%, transparent)` }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: CATEGORY_COLORS[service.category] }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.provider}</p>
                  </div>
                </div>
                {costAt100k && (
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(costAt100k.monthlyCost)}/mo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{service.role}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" aria-hidden="true" />
                <span>
                  {service.usageEstimate.perUserPerMonth.toLocaleString()}{" "}
                  {service.usageEstimate.metric}/user/mo
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected service drill-down */}
      {selectedServiceData && (
        <Card className="p-5 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selectedServiceData.serviceName} — cost breakdown</h3>
            <button
              onClick={() => setSelectedService(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close breakdown"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {selectedServiceData.breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    item.value < 0 ? "text-primary" : ""
                  }`}
                >
                  {item.value < 0 ? "-" : ""}${Math.abs(item.value).toFixed(2)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <span className="font-medium">Total at 100K users</span>
              <span className="font-bold text-lg tabular-nums">
                {formatCurrency(selectedServiceData.monthlyCost)}/mo
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Cost projection chart — THE MONEY SHOT */}
      <h2 className="text-lg font-semibold mb-3">Cost projection at scale</h2>
      <Card className="p-5 md:p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {projection.scales.map((scale) => (
            <div key={scale.users} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{scale.label}</p>
              <p className="text-xl md:text-2xl font-bold tabular-nums">
                {formatCurrency(scale.totalCost)}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          ))}
        </div>

        <div className="w-full h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={projection.scales.map((s) => ({
                ...s,
                name: s.label,
              }))}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCurrency(v)}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(v: number) => [`${formatCurrency(v)}/mo`, "Total cost"]}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="totalCost" radius={[8, 8, 0, 0]}>
                {projection.scales.map((_, i) => (
                  <Cell key={i} fill={`var(--chart-${i + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked breakdown legend */}
        <div className="mt-4 space-y-1.5">
          {scale100k?.services.slice(0, 5).map((s) => (
            <div key={s.serviceId} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[s.category] }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{s.serviceName}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatCurrency(s.monthlyCost)}/mo ({s.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Optimization suggestions */}
      <div aria-live="polite" aria-atomic="true">
      {optimizeError && (
        <Card className="p-4 mb-4 border-muted bg-muted/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">Optimizations unavailable</p>
              <p className="text-sm text-muted-foreground mt-1">{optimizeError}</p>
            </div>
          </div>
        </Card>
      )}
      {optimizations.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-lg font-semibold">Optimization suggestions</h2>
            <Button
              variant={showOptimizations ? "ghost" : "default"}
              size="sm"
              onClick={() => setShowOptimizations(!showOptimizations)}
            >
              <TrendingDown className="w-4 h-4 mr-1" aria-hidden="true" />
              {showOptimizations ? "Hide" : "Show optimizations"}
            </Button>
          </div>

          {showOptimizations && (
            <>
              <Card className="p-5 mb-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total potential savings</p>
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {formatCurrency(totalSavings)}/mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">At 100K users</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {projection.totalMonthlyAt100k > 0
                        ? `${((totalSavings / projection.totalMonthlyAt100k) * 100).toFixed(0)}% reduction`
                        : "—"}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3 mb-8">
                {optimizations.map((opt) => (
                  <Card key={opt.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{opt.title}</h3>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs shrink-0"
                          >
                            {opt.effort} effort
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{opt.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {opt.affectedServices.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-xs capitalize">
                            {opt.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary tabular-nums">
                          -{formatCurrency(opt.savingsPerMonth)}
                        </p>
                        <p className="text-xs text-muted-foreground">per month</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t">
        <p className="text-sm text-muted-foreground mb-2">
          Pricing data sourced from public provider pricing pages. Verified 2026-08-26.
        </p>
        <p className="text-xs text-muted-foreground">
          Estimates only — verify with providers before budgeting.
        </p>
      </div>
    </section>
  );
}
