/**
 * Doctavian signature API route.
 *
 * Sponsor: Doctavian: Generate It Right. Sign It Tight. ($1,000 prize)
 *
 * This route is the server-side half of the Doctavian integration:
 *   1. Receives the cost analysis data from the frontend
 *   2. Generates a professional PDF report with pdfkit
 *   3. Uploads the PDF to Doctavian's signature storage
 *   4. Creates a signature envelope with positioned signature fields
 *   5. Sends the envelope — the signer receives an email from Doctavian
 *   6. Returns the result (document URN, envelope ID, status)
 *
 * The AI agent (Gemini) produced the structured cost data. We turn that
 * into a formatted PDF and route it through Doctavian's e-signature
 * workflow for legally binding acknowledgment.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadAndSendForSignature } from "@/lib/doctavian-client";
import { generateCostReportPdf, CostReportPdfData } from "@/lib/pdf-report";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      analysis,
      projection,
      optimizations,
      signerName,
      signerEmail,
      appName,
    } = body as {
      analysis: {
        summary: string;
        estimatedComplexity: string;
        services: Array<{
          name: string;
          provider: string;
          category: string;
          role: string;
          id: string;
          usageEstimate: { perUserPerMonth: number; metric: string };
        }>;
      };
      projection: {
        dominantService: string;
        totalMonthlyAt100k: number;
        scales: Array<{
          label: string;
          users: number;
          totalCost: number;
          services: Array<{
            serviceId: string;
            serviceName: string;
            monthlyCost: number;
            percentage: number;
            category: string;
          }>;
        }>;
      };
      optimizations: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        effort: string;
        savingsPerMonth: number;
        affectedServices: string[];
      }>;
      signerName: string;
      signerEmail: string;
      appName: string;
    };

    if (!analysis || !projection) {
      return NextResponse.json(
        { error: "Missing analysis or projection data" },
        { status: 400 }
      );
    }

    if (!signerName || !signerEmail) {
      return NextResponse.json(
        { error: "Missing signer name or email" },
        { status: 400 }
      );
    }

    // Build the data payload for the PDF report
    const scale100k = projection.scales.find((s) => s.users === 100000);
    const serviceMap = new Map(
      scale100k?.services.map((s) => [s.serviceId, s]) || []
    );

    const reportData: CostReportPdfData = {
      appName: appName || "Untitled Application",
      generatedAt: new Date().toISOString(),
      summary: analysis.summary,
      estimatedComplexity: analysis.estimatedComplexity,
      serviceCount: analysis.services.length,
      dominantService: projection.dominantService,
      services: analysis.services.map((s) => {
        const cost = serviceMap.get(s.id);
        return {
          name: s.name,
          provider: s.provider,
          category: s.category,
          role: s.role,
          monthlyCost: cost?.monthlyCost || 0,
          percentage: cost?.percentage || 0,
          usageMetric: s.usageEstimate.metric,
          usagePerUser: s.usageEstimate.perUserPerMonth,
        };
      }),
      projections: projection.scales.map((s) => ({
        label: s.label,
        users: s.users,
        totalCost: s.totalCost,
      })),
      optimizations: optimizations.map((o) => ({
        title: o.title,
        description: o.description,
        category: o.category,
        effort: o.effort,
        savingsPerMonth: o.savingsPerMonth,
        affectedServices: o.affectedServices,
      })),
      totalSavings: optimizations.reduce((sum, o) => sum + o.savingsPerMonth, 0),
      totalMonthlyAt100k: projection.totalMonthlyAt100k,
    };

    // Generate the PDF report
    const pdfBuffer = await generateCostReportPdf(reportData);

    const safeName = (appName || "analysis").replace(/[^a-zA-Z0-9-]/g, "-");
    const documentName = `CloudCost-Report-${safeName}`;

    // Run the Doctavian signature pipeline
    const result = await uploadAndSendForSignature({
      pdfBuffer,
      pdfFileName: `${documentName}.pdf`,
      documentName,
      signerName,
      signerEmail,
      pageCount: 1,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[doctavian/route] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
