import { NextRequest, NextResponse } from "next/server";
import { runNutrientPipeline, type CostReportData } from "@/lib/nutrient-dws";

export const runtime = "nodejs";

/**
 * POST /api/report
 *
 * Runs the Nutrient DWS document pipeline:
 * 1. Generates a PDF cost report from the analysis data (Processor API)
 * 2. Extracts structured data from the PDF with confidence scores (Data Extraction API)
 * 3. Returns the PDF (base64) + extracted fields + audit trail
 *
 * Sponsor: Nutrient DWS: Turn Documents Into Something People Actually Trust
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.appDescription || !body.services || !Array.isArray(body.services)) {
      return NextResponse.json(
        { error: "appDescription and services array are required" },
        { status: 400 }
      );
    }

    const processorKey = process.env.NUTRIENT_PROCESSOR_API_KEY;
    const extractionKey = process.env.NUTRIENT_DATA_EXTRACTION_API_KEY;

    if (!processorKey || !extractionKey) {
      return NextResponse.json(
        { error: "Nutrient DWS API keys are not configured" },
        { status: 500 }
      );
    }

    // Build the report data from the request
    const reportData: CostReportData = {
      appDescription: body.appDescription,
      summary: body.summary || "",
      estimatedComplexity: body.estimatedComplexity || "moderate",
      totalMonthlyCost: Number(body.totalMonthlyCost) || 0,
      totalAnnualCost: Number(body.totalAnnualCost) || 0,
      services: body.services.map((s: {
        name: string; provider: string; category: string;
        role: string; monthlyCost: number; annualCost: number;
        pricingDescription: string;
      }) => ({
        name: s.name,
        provider: s.provider,
        category: s.category,
        role: s.role,
        monthlyCost: Number(s.monthlyCost) || 0,
        annualCost: Number(s.annualCost) || 0,
        pricingDescription: s.pricingDescription || "",
      })),
      generatedAt: new Date().toISOString(),
    };

    // Run the full pipeline
    const result = await runNutrientPipeline(processorKey, extractionKey, reportData);

    return NextResponse.json({
      success: true,
      pdfBase64: result.pdfBase64,
      pdfSizeBytes: result.pdfSizeBytes,
      extractedFields: result.extractedFields,
      extractedMarkdown: result.extractedMarkdown,
      averageConfidence: result.averageConfidence,
      auditTrail: result.auditTrail,
    });
  } catch (error) {
    console.error("Nutrient DWS pipeline error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Document pipeline failed: ${message}` },
      { status: 500 }
    );
  }
}
