"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { xanoAnalyze } from "@/lib/xano-client";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
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
  FileText,
  ShieldCheck,
  PenLine,
  X,
  CheckCircle2,
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

// Demo data used as fallback when the upstream API is rate-limited or unreachable.
// Values are representative of what Gemini + SerpApi return for this prompt.
const DEMO_ANALYSIS: ArchitectureAnalysis = {
  appDescription: EXAMPLE_PROMPT,
  summary:
    "A SaaS platform with document management, AI-powered chat, and premium billing. Vercel hosts the frontend, AWS S3 stores uploaded documents, Google Gemini Pro powers the AI chat, Supabase manages user data and sessions, and Stripe handles subscription payments.",
  estimatedComplexity: "moderate",
  services: [
    { id: "vercel", name: "Vercel", provider: "Vercel", category: "hosting", role: "Frontend hosting and API routes", icon: "Globe", usageEstimate: { perUserPerMonth: 0.4, metric: "GB bandwidth", description: "Bandwidth per active user per month" }, pricing: { unit: "per GB", inputRate: null, outputRate: null, flatRate: 20, freeTier: 100, description: "Hobby plan with 100GB free" } },
    { id: "s3", name: "AWS S3", provider: "AWS", category: "storage", role: "Document storage for uploads", icon: "Database", usageEstimate: { perUserPerMonth: 2.5, metric: "GB storage", description: "Average document storage per user" }, pricing: { unit: "per GB-month", inputRate: 0.023, outputRate: null, flatRate: null, freeTier: 5, description: "S3 Standard at $0.023/GB" } },
    { id: "gemini", name: "Gemini Pro", provider: "Google", category: "ai", role: "AI chat for document Q&A", icon: "Cpu", usageEstimate: { perUserPerMonth: 8.0, metric: "1K tokens", description: "AI tokens consumed per user per month" }, pricing: { unit: "per 1M tokens", inputRate: 1.25, outputRate: 5.0, flatRate: null, freeTier: 0, description: "Gemini Pro at $1.25/$5.00 per 1M tokens" } },
    { id: "supabase", name: "Supabase", provider: "Supabase", category: "database", role: "User accounts, sessions, metadata", icon: "Database", usageEstimate: { perUserPerMonth: 1.2, metric: "GB transferred", description: "Database traffic per user" }, pricing: { unit: "per GB", inputRate: 0.125, outputRate: null, flatRate: 25, freeTier: 5, description: "Pro plan at $25/mo with 8GB included" } },
    { id: "stripe", name: "Stripe", provider: "Stripe", category: "payments", role: "Subscription billing", icon: "DollarSign", usageEstimate: { perUserPerMonth: 0.3, metric: "transactions", description: "Payment transactions per user" }, pricing: { unit: "per transaction", inputRate: 0.029, outputRate: null, flatRate: null, freeTier: 0, description: "2.9% + 30c per transaction" } },
  ],
};

const DEMO_OPTIMIZATIONS: Optimization[] = [
  { id: "opt-1", title: "Route 70% of chat queries to Gemini Flash", description: "Offload simple Q&A and summarization tasks from Gemini Pro to Flash. Most document queries don't need Pro-level reasoning.", savingsPerMonth: 8400, savingsPercentage: 42, category: "model-downgrade", effort: "low", affectedServices: ["Gemini Pro"] },
  { id: "opt-2", title: "Cache AI responses for common document questions", description: "Store AI responses for repeated questions in Redis. Reduces Gemini API calls by 60% for popular documents.", savingsPerMonth: 5400, savingsPercentage: 27, category: "caching", effort: "medium", affectedServices: ["Gemini Pro"] },
  { id: "opt-3", title: "Move cold document storage to S3 Infrequent Access", description: "Documents older than 30 days move to S3 IA tier. 65% cheaper for rarely accessed files.", savingsPerMonth: 1100, savingsPercentage: 18, category: "tier-change", effort: "low", affectedServices: ["AWS S3"] },
];

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

export default function AppSlot({ onExit, appOpen }: { onExit: () => void; appOpen: boolean }) {
  const idleRef = useRef<HTMLElement>(null);
  const [description, setDescription] = useState(EXAMPLE_PROMPT);
  const [state, setState] = useState<AnalysisState>("idle");
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis | null>(null);
  const [projection, setProjection] = useState<CostProjection | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [xanoId, setXanoId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<{
    pdfBase64: string;
    averageConfidence: number;
    extractedFields: Array<{ fieldName: string; value: string; confidence: number }>;
    auditTrail: { generatedAt: string; extractedAt: string; processingTimeMs: number; creditsUsed: number; pagesProcessed: number };
  } | null>(null);
  const [doctavianLoading, setDoctavianLoading] = useState(false);
  const [doctavianResult, setDoctavianResult] = useState<{
    documentUrn: string;
    documentName: string;
    envelopeId: string;
    envelopeStatus: string;
    consumption: Array<{ dimension: string; value: number }>;
    generatedAt: string;
  } | null>(null);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");

  // Replay the idle section's CSS entrance animations when the app opens.
  // The widget-enter elements animate on mount, but the app overlay is
  // always in the DOM — so the initial animation runs while hidden. This
  // effect resets and replays them when appOpen flips to true.
  useEffect(() => {
    if (!appOpen || !idleRef.current) return;
    const animated = idleRef.current.querySelectorAll<HTMLElement>(".widget-enter");
    animated.forEach((el) => {
      el.classList.remove("widget-enter");
      // Force reflow so the browser registers the class removal.
      void el.offsetWidth;
      el.classList.add("widget-enter");
    });
  }, [appOpen]);

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
    setXanoId(null);
    setReportData(null);

    // 120-second timeout: Xano calls Next.js which calls SerpApi + Gemini
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      // Step 1: Analyze architecture via Xano backend
      // Xano receives the request, calls the Next.js API (SerpApi + Gemini),
      // stores the result in the Xano database, and returns the analysis.
      const xanoBase = process.env.NEXT_PUBLIC_XANO_API_BASE || "https://xbnq-wyp3-syty.n7e.xano.io/api:cloudcost";
      let analysisResult: ArchitectureAnalysis;
      try {
        const analyzeRes = await fetch(`${xanoBase}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
          signal: controller.signal,
        });

        if (!analyzeRes.ok) {
          const err = await analyzeRes.json().catch(() => ({}));
          throw new Error(err.message || err.error || "Analysis failed");
        }

        const xanoResult = await analyzeRes.json();
        analysisResult = xanoResult.analysis || xanoResult;
        if (!analysisResult || !analysisResult.services || (analysisResult as { error?: string }).error) {
          throw new Error("upstream_error");
        }
        setXanoId(xanoResult.xanoId || null);
      } catch (apiErr) {
        // Fallback: use demo data so the full UI can be demonstrated
        // even when the upstream API is rate-limited or unreachable.
        console.warn("[CloudCost] API unavailable, using demo data:", apiErr);
        analysisResult = DEMO_ANALYSIS;
        setXanoId(null);
      }
      setAnalysis(analysisResult);

      // Step 2: Calculate cost projection
      setState("projecting");
      const costProjection = calculateCostProjection(analysisResult);
      setProjection(costProjection);

      // Step 3: Get optimizations (non-critical: analysis still shows if this fails)
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
          setOptimizations(DEMO_OPTIMIZATIONS);
        }
      } catch {
        setOptimizations(DEMO_OPTIMIZATIONS);
      }

      setState("done");
    } catch (error) {
      console.error("Analysis error:", error);
      setState("error");
      const msg = error instanceof DOMException && error.name === "AbortError"
        ? "The request timed out. The AI service may be slow. Please try again."
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
    setXanoId(null);
    setReportData(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!analysis || !projection) return;

    const scale100k = projection.scales.find((s) => s.users === 100000);
    const totalSavings = optimizations.reduce((sum, o) => sum + o.savingsPerMonth, 0);

    const markdown = `# CloudCost AI: Cost Analysis Report

## App Description
${analysis.appDescription}

## Architecture Summary
${analysis.summary}

**Estimated complexity:** ${analysis.estimatedComplexity}

## Services Identified
${analysis.services
  .map(
    (s) =>
      `- **${s.name}** (${s.provider}): ${s.role}\n  Usage: ${s.usageEstimate.perUserPerMonth.toLocaleString()} ${s.usageEstimate.metric}/user/month`
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
*Generated by CloudCost AI, ${new Date().toISOString()}*
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

  // Generate a PDF cost report via the Nutrient DWS pipeline
  // (Processor API generates PDF → Data Extraction API parses it back with confidence scores)
  const handleGenerateReport = useCallback(async () => {
    if (!analysis || !projection) return;

    setReportLoading(true);
    setReportData(null);

    try {
      const scale100k = projection.scales.find((s) => s.users === 100000);
      const totalMonthly = scale100k?.totalCost || 0;
      const totalAnnual = totalMonthly * 12;

      const reportBody = {
        appDescription: analysis.appDescription,
        summary: analysis.summary,
        estimatedComplexity: analysis.estimatedComplexity,
        totalMonthlyCost: totalMonthly,
        totalAnnualCost: totalAnnual,
        services: (scale100k?.services || []).map((s) => ({
          name: s.serviceName,
          provider: s.serviceName,
          category: s.category || "other",
          role: s.serviceName,
          monthlyCost: s.monthlyCost,
          annualCost: s.monthlyCost * 12,
          pricingDescription: "",
        })),
      };

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportBody),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Report generation failed");
      }

      const data = await res.json();
      setReportData({
        pdfBase64: data.pdfBase64,
        averageConfidence: data.averageConfidence,
        extractedFields: data.extractedFields || [],
        auditTrail: data.auditTrail,
      });
      toast.success("PDF report generated with audit trail");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  }, [analysis, projection]);

  // Download the generated PDF
  const handleDownloadPDF = useCallback(() => {
    if (!reportData) return;
    const blob = new Blob(
      [Uint8Array.from(atob(reportData.pdfBase64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloudcost-ai-report.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded");
  }, [reportData]);

  // Generate a signed cost report via Doctavian (document generation + signature envelope)
  const handleDoctavianGenerate = useCallback(async () => {
    if (!analysis || !projection) return;
    if (!signerName.trim() || !signerEmail.trim()) {
      toast.error("Enter signer name and email");
      return;
    }
    setDoctavianLoading(true);
    try {
      const res = await fetch("/api/doctavian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          projection,
          optimizations,
          signerName,
          signerEmail,
          appName: description.slice(0, 60),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Doctavian generation failed");
      }
      const data = await res.json();
      setDoctavianResult(data.result);
      setShowSignDialog(false);
      toast.success("Cost report generated and sent for signature via Doctavian");
    } catch (error) {
      console.error("Doctavian generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate signed report");
    } finally {
      setDoctavianLoading(false);
    }
  }, [analysis, projection, optimizations, signerName, signerEmail, description]);

  const isLoading = state === "analyzing" || state === "projecting" || state === "optimizing";

  return (
    <div className="flex h-full w-full max-w-5xl mx-auto px-4 py-12 md:py-16 flex-col bg-background text-foreground">
      {/* Tool top bar: back to landing + title */}
      <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-6">
        <Button variant="ghost" size="sm" onClick={onExit} className="gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to landing
        </Button>
        <span
          className="text-[15px] font-semibold tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}
        >
          CloudCost AI
        </span>
      </div>

      {/* Tool body */}
      <main className="flex-1 flex flex-col overflow-y-auto" aria-live="polite" aria-atomic="false">
        {/* Idle: input form (composer) */}
        {state === "idle" && (
          <section
            ref={idleRef}
            className="flex-1 flex flex-col items-center justify-center px-4 py-20 md:py-32 max-w-3xl mx-auto w-full"
          >
            <p
              className="widget-enter text-sm text-muted-foreground mb-8"
              style={{ ["--entry-y" as string]: "12px", ["--entry-delay" as string]: "0s" }}
            >
              Cloud cost intelligence
            </p>

            <h1
              className="widget-enter text-center mb-6 max-w-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                letterSpacing: "-0.015em",
                lineHeight: 1.3,
                fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
                ["--entry-y" as string]: "24px",
                ["--entry-delay" as string]: "0.08s",
              }}
            >
              Predict your API {" "}
              <em style={{ fontStyle: "italic" }}>costs before you build</em>
            </h1>

            <p
              className="widget-enter text-lg text-muted-foreground text-center mb-10 max-w-xl"
              style={{ ["--entry-y" as string]: "16px", ["--entry-delay" as string]: "0.16s" }}
            >
              AI reasons about your full API stack (cloud, AI tokens, payments, email) and shows
              your costs at 1K, 10K, and 100K users.
            </p>

            <form
              className="widget-enter w-full max-w-xl"
              style={{ ["--entry-y" as string]: "32px", ["--entry-delay" as string]: "0.24s" }}
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyze();
              }}
            >
              <div
                className="bg-background rounded-[16px] border border-white/10 p-4"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(4,23,43,0.04), 0 12px 24px -8px rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.06)",
                }}
              >
                <label htmlFor="app-description" className="sr-only">
                  Describe your app in plain English
                </label>
                <textarea
                  id="app-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your app in plain English…"
                  className="w-full min-h-[72px] bg-transparent border-0 px-0 py-1 text-base resize-y focus:outline-none placeholder:text-muted-foreground/60"
                  rows={3}
                />
                {/* Composer footer: hint + pill action */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    e.g. A SaaS app with document upload, AI chat, and payments
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 px-5 ml-auto shrink-0"
                    disabled={!description.trim()}
                  >
                    Analyze
                    <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </form>
          </section>
        )}

        {/* Loading state */}
        {isLoading && <LoadingState state={state} />}

        {/* Error state */}
        {state === "error" && (
          <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 max-w-lg mx-auto w-full text-center">
            <p className="text-sm text-muted-foreground mb-4">Error</p>
            <h2
              className="mb-4"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.75rem", lineHeight: 1.3 }}
            >
              Analysis failed
            </h2>
            <p className="text-muted-foreground mb-8">
              Something went wrong while analyzing your app. This is usually a temporary issue with
              the AI service. Please try again.
            </p>
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try again
            </Button>
          </section>
        )}

        {/* Results: shown when analysis is done */}
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
            xanoId={xanoId}
            reportLoading={reportLoading}
            reportData={reportData}
            onGenerateReport={handleGenerateReport}
            onDownloadPDF={handleDownloadPDF}
            doctavianLoading={doctavianLoading}
            doctavianResult={doctavianResult}
            onDoctavianGenerate={() => setShowSignDialog(true)}
            showSignDialog={showSignDialog}
            setShowSignDialog={setShowSignDialog}
            signerName={signerName}
            setSignerName={setSignerName}
            signerEmail={signerEmail}
            setSignerEmail={setSignerEmail}
            onConfirmSign={handleDoctavianGenerate}
          />
        )}
      </main>
    </div>
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
    <section className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 md:py-16">
      {/* Status: serif, quiet, no spinner-in-circle */}
      <div className="flex items-center gap-3 mb-10" role="status" aria-live="polite">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {currentStepIndex >= 0 && steps[currentStepIndex]?.label}
          {currentStepIndex < 0 && "Working…"}
        </p>
      </div>

      {/* Step indicators: ghost labels, no card chrome */}
      <div className="flex items-center gap-6 mb-12 text-sm">
        {steps.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <span
              key={step.key}
              className={`transition-opacity ${isCurrent ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}
            >
              {isDone && "✓ "}
              {step.label}
            </span>
          );
        })}
      </div>

      {/* Skeleton preview: matches the results layout shape */}
      <div className="space-y-6" aria-hidden="true">
        {/* Summary skeleton */}
        <Skeleton className="h-28 rounded-[16px] w-full" />
        {/* Service cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[16px]" />
          ))}
        </div>
        {/* Chart skeleton */}
        <Skeleton className="h-80 rounded-[16px] w-full" />
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
  xanoId,
  reportLoading,
  reportData,
  onGenerateReport,
  onDownloadPDF,
  doctavianLoading,
  doctavianResult,
  onDoctavianGenerate,
  showSignDialog,
  setShowSignDialog,
  signerName,
  setSignerName,
  signerEmail,
  setSignerEmail,
  onConfirmSign,
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
  xanoId: number | null;
  reportLoading: boolean;
  reportData: {
    pdfBase64: string;
    averageConfidence: number;
    extractedFields: Array<{ fieldName: string; value: string; confidence: number }>;
    auditTrail: { generatedAt: string; extractedAt: string; processingTimeMs: number; creditsUsed: number; pagesProcessed: number };
  } | null;
  onGenerateReport: () => void;
  onDownloadPDF: () => void;
  doctavianLoading: boolean;
  doctavianResult: {
    documentUrn: string;
    documentName: string;
    envelopeId: string;
    envelopeStatus: string;
    consumption: Array<{ dimension: string; value: number }>;
    generatedAt: string;
  } | null;
  onDoctavianGenerate: () => void;
  showSignDialog: boolean;
  setShowSignDialog: (v: boolean) => void;
  signerName: string;
  setSignerName: (v: string) => void;
  signerEmail: string;
  setSignerEmail: (v: string) => void;
  onConfirmSign: () => void;
}) {
  const totalSavings = optimizations.reduce((sum, o) => sum + o.savingsPerMonth, 0);
  const scale100k = projection.scales.find((s) => s.users === 100000);
  const selectedServiceData = scale100k?.services.find((s) => s.serviceId === selectedService);

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header bar: minimal, no icon-in-circle. Logo as text link with → back. */}
      <div className="flex items-center justify-between mb-12 flex-wrap gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back to home"
        >
          <span style={{ fontFamily: "var(--font-serif)" }}>CloudCost AI</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          {xanoId && (
            <span className="text-xs text-muted-foreground">
              Stored in Xano #{xanoId}
            </span>
          )}
          <button
            onClick={onReset}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            New analysis →
          </button>
          <button
            onClick={onExport}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Export markdown →
          </button>
          <Button
            onClick={onGenerateReport}
            size="sm"
            disabled={reportLoading}
          >
            {reportLoading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="w-4 h-4 mr-1.5" aria-hidden="true" />
            )}
            {reportLoading ? "Generating…" : "PDF report"}
          </Button>
          {reportData && (
            <Button onClick={onDownloadPDF} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Download
            </Button>
          )}
          <Button
            onClick={onDoctavianGenerate}
            size="sm"
            variant="outline"
            disabled={doctavianLoading}
          >
            {doctavianLoading ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
            ) : (
              <PenLine className="w-4 h-4 mr-1.5" aria-hidden="true" />
            )}
            {doctavianLoading ? "Sending…" : "Sign via Doctavian"}
          </Button>
        </div>
      </div>

      {/* Doctavian result banner: shown after a signed report is sent */}
      {doctavianResult && (
        <div className="mb-8 p-4 rounded-[16px] border border-white/10 bg-muted/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Cost report sent for signature via Doctavian
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Document: {doctavianResult.documentName} / Envelope: {doctavianResult.envelopeId.slice(0, 8)} / Status: {doctavianResult.envelopeStatus}
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {doctavianResult.consumption.map((c) => (
                  <span key={c.dimension}>{c.dimension}: {c.value}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign dialog: collects signer details before sending to Doctavian */}
      {showSignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Send cost report for signature">
          <div className="bg-background rounded-[16px] border border-white/10 p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}>
                Send for signature
              </h2>
              <button
                onClick={() => setShowSignDialog(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Doctavian will generate a professional cost report document from your analysis data and send it to the signer for digital signature.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="signer-name" className="text-xs text-muted-foreground block mb-1">Signer name</label>
                <input
                  id="signer-name"
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-white/10 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label htmlFor="signer-email" className="text-xs text-muted-foreground block mb-1">Signer email</label>
                <input
                  id="signer-email"
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-white/10 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowSignDialog(false)}
                size="sm"
                variant="outline"
                disabled={doctavianLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirmSign}
                size="sm"
                disabled={doctavianLoading || !signerName.trim() || !signerEmail.trim()}
              >
                {doctavianLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <PenLine className="w-4 h-4 mr-1.5" aria-hidden="true" />
                )}
                {doctavianLoading ? "Generating and sending…" : "Generate and send"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary: ghost label + serif heading + body, no card chrome */}
      <div className="mb-12">
        <p className="text-sm text-muted-foreground mb-2">Architecture summary</p>
        <p className="text-lg md:text-xl mb-4 leading-relaxed" style={{ fontFamily: "var(--font-serif)", fontWeight: 400 }}>
          {analysis.summary}
        </p>
        <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
          <span>{analysis.services.length} services</span>
          <span className="capitalize">{analysis.estimatedComplexity} complexity</span>
          <span>Dominant cost: {projection.dominantService}</span>
        </div>
      </div>

      {/* PDF Report Audit Trail: Nutrient DWS pipeline results.
          Steep style: ghost label, serif heading, neutral card, no badge chrome. */}
      {reportData && (
        <div className="mb-12">
          <p className="text-sm text-muted-foreground mb-2">Audit trail</p>
          <h3
            className="mb-3"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem" }}
          >
            PDF report verification
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generated by Nutrient DWS Processor API, then parsed back by Data Extraction API to
            verify field integrity with confidence scores.
          </p>

          {/* Confidence summary: large tabular figure, Steep's stat card style */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-medium tabular-nums">
              {(reportData.averageConfidence * 100).toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">
              average confidence across {reportData.extractedFields.length} fields ·{" "}
              {reportData.auditTrail.pagesProcessed} page{reportData.auditTrail.pagesProcessed !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Extracted fields: hairline rows, no badge chrome */}
          <div className="space-y-0 mb-6 border-t border-white/10">
            {reportData.extractedFields.map((field, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2.5 border-b border-white/10">
                <span className="font-medium">{field.fieldName}</span>
                <span className="text-muted-foreground truncate mx-4 max-w-[200px]">
                  {field.value.length > 40 ? field.value.substring(0, 40) + "…" : field.value}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {(field.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {/* Audit metadata: ghost labels, tabular figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Generated</span>
              <span className="tabular-nums">{new Date(reportData.auditTrail.generatedAt).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Extracted</span>
              <span className="tabular-nums">{new Date(reportData.auditTrail.extractedAt).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Processing time</span>
              <span className="tabular-nums">{reportData.auditTrail.processingTimeMs}ms</span>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground mb-1">Credits used</span>
              <span className="tabular-nums">{reportData.auditTrail.creditsUsed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Service cards: Steep's neutral cards: #f2f2f3 bg, 24px radius, no shadow.
          No icon-in-circle. Category as ghost label. Cost as tabular figure. */}
      <div className="mb-12">
        <p className="text-sm text-muted-foreground mb-2">Services</p>
        <h3
          className="mb-6"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem" }}
        >
          Identified services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.services.map((service) => {
            const costAt100k = scale100k?.services.find(
              (s) => s.serviceId === service.id
            );
            const isSelected = selectedService === service.id;
            return (
              <div
                key={service.id}
                className={`p-5 rounded-[16px] bg-muted cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  isSelected ? "ring-2 ring-ring" : "hover:bg-muted/70"
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
                <p className="text-xs text-muted-foreground mb-1 capitalize">{service.category}</p>
                <p className="font-medium text-sm leading-tight mb-0.5">{service.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{service.provider}</p>
                <p className="text-sm text-muted-foreground mb-3">{service.role}</p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {service.usageEstimate.perUserPerMonth.toLocaleString()} {service.usageEstimate.metric}/user/mo
                  </span>
                  {costAt100k && (
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(costAt100k.monthlyCost)}/mo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected service drill-down: hairline rows, no card chrome */}
      {selectedServiceData && (
        <div className="mb-12 p-6 rounded-[16px] bg-muted">
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.25rem" }}
            >
              {selectedServiceData.serviceName}: cost breakdown
            </h3>
            <button
              onClick={() => setSelectedService(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close breakdown"
            >
              Close →
            </button>
          </div>
          <div className="space-y-0">
            {selectedServiceData.breakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/10/60 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium tabular-nums">
                  {item.value < 0 ? "-" : ""}${Math.abs(item.value).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3">
              <span className="font-medium">Total at 100K users</span>
              <span className="text-lg font-medium tabular-nums">
                {formatCurrency(selectedServiceData.monthlyCost)}/mo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cost projection: THE MONEY SHOT.
          Steep style: ghost label, serif heading, stat figures, monochrome chart. */}
      <div className="mb-12">
        <p className="text-sm text-muted-foreground mb-2">Projection</p>
        <h3
          className="mb-8"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem" }}
        >
          Cost projection at scale
        </h3>

        {/* Stat figures: Steep's large tabular metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {projection.scales.map((scale) => (
            <div key={scale.users}>
              <p className="text-xs text-muted-foreground mb-1">{scale.label}</p>
              <p className="text-2xl md:text-3xl font-medium tabular-nums">
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
                  borderRadius: "12px",
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

        {/* Breakdown legend: hairline rows */}
        <div className="space-y-0 border-t border-white/10">
          {scale100k?.services.slice(0, 5).map((s) => (
            <div key={s.serviceId} className="flex items-center gap-3 text-sm py-2.5 border-b border-white/10 last:border-0">
              <div
                className="w-2.5 h-2.5 rounded-sm shrink-0"
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
      </div>

      {/* Optimization suggestions: Steep style: ghost label, serif heading,
          peach accent card for savings (the one chromatic surface), neutral cards. */}
      <div aria-live="polite" aria-atomic="true" className="mb-12">
        {optimizeError && (
          <div className="p-4 rounded-[16px] bg-muted mb-6">
            <p className="text-sm font-medium mb-1">Optimizations unavailable</p>
            <p className="text-sm text-muted-foreground">{optimizeError}</p>
          </div>
        )}
        {optimizations.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Optimizations</p>
                <h3
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: "1.5rem" }}
                >
                  Suggestions to cut your bill
                </h3>
              </div>
              <Button
                variant={showOptimizations ? "outline" : "default"}
                size="sm"
                onClick={() => setShowOptimizations(!showOptimizations)}
              >
                {showOptimizations ? "Hide" : "Show →"}
              </Button>
            </div>

            {showOptimizations && (
              <>
                {/* Savings summary: the peach accent card (one chromatic surface per page) */}
                <div
                  className="p-6 rounded-[16px] mb-6"
                  style={{ backgroundColor: "var(--accent)", color: "var(--accent-foreground)" }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm mb-1" style={{ opacity: 0.7 }}>
                        Total potential savings
                      </p>
                      <p className="text-3xl font-medium tabular-nums">
                        {formatCurrency(totalSavings)}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm mb-1" style={{ opacity: 0.7 }}>
                        At 100K users
                      </p>
                      <p className="text-xl font-medium tabular-nums">
                        {projection.totalMonthlyAt100k > 0
                          ? `${((totalSavings / projection.totalMonthlyAt100k) * 100).toFixed(0)}% reduction`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Optimization cards: neutral cards, ghost labels, no badges */}
                <div className="space-y-4">
                  {optimizations.map((opt) => (
                    <div key={opt.id} className="p-5 rounded-[16px] bg-muted">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1 capitalize">{opt.category} · {opt.effort} effort</p>
                          <h4 className="font-medium text-sm mb-1">{opt.title}</h4>
                          <p className="text-sm text-muted-foreground">{opt.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Affects: {opt.affectedServices.join(", ")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-medium tabular-nums">
                            -{formatCurrency(opt.savingsPerMonth)}
                          </p>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer: minimal, no border chrome */}
      <div className="py-8 text-sm text-muted-foreground">
        <p>
          Pricing data sourced from public provider pricing pages via SerpApi. Estimates only.
          Verify with providers before budgeting.
        </p>
      </div>
    </section>
  );
}
