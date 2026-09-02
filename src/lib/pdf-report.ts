/**
 * Generate a cost analysis report PDF from the structured analysis data.
 *
 * This replaces the Doctavian DOCX template engine flow, which requires
 * templates built with the Maven Mule Word Add-in. Instead, we generate
 * the PDF directly with pdfkit and send it through Doctavian's signature
 * envelope workflow for e-signature.
 */

import PDFDocument from "pdfkit";

export interface CostReportPdfData {
  appName: string;
  generatedAt: string;
  summary: string;
  estimatedComplexity: string;
  serviceCount: number;
  dominantService: string;
  services: Array<{
    name: string;
    provider: string;
    category: string;
    role: string;
    monthlyCost: number;
    percentage: number;
    usageMetric: string;
    usagePerUser: number;
  }>;
  projections: Array<{
    label: string;
    users: number;
    totalCost: number;
  }>;
  optimizations: Array<{
    title: string;
    description: string;
    category: string;
    effort: string;
    savingsPerMonth: number;
    affectedServices: string[];
  }>;
  totalSavings: number;
  totalMonthlyAt100k: number;
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Generate a cost analysis report PDF buffer.
 */
export function generateCostReportPdf(data: CostReportPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: `CloudCost AI Report — ${data.appName}`,
        Author: "CloudCost AI",
        Subject: "Cloud Cost Analysis Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 144; // margins
    // Sponsor-synced palette — matches the app's globals.css tokens
    const dark = "#191919";      // ld-dark — header band, headings
    const muted = "#58595b";     // ld-ink-soft — subtitle, meta
    const accent = "#377FEA";    // SerpApi blue — savings callout
    const light = "#f8f8f8";     // gray-01 — table headers, card bg
    const border = "#e6e6e6";    // ld-border — table borders

    // --- Header band ---
    doc.rect(0, 0, pageWidth, 90).fill(dark);
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("CloudCost AI", 72, 28);
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#939598")
      .text("Cloud Cost Analysis Report", 72, 58);

    doc
      .fontSize(9)
      .fillColor("#939598")
      .text(fmtDate(data.generatedAt), pageWidth - 72 - 180, 58, {
        width: 180,
        align: "right",
      });

    // --- App name ---
    doc.moveDown(2);
    doc
      .fillColor(dark)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(data.appName, 72, 120);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(muted)
      .text(
        `Complexity: ${data.estimatedComplexity}  •  ${data.serviceCount} services identified  •  Dominant: ${data.dominantService}`,
        72,
        148
      );

    // --- Summary ---
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("Executive Summary", 72, 185);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#414042")
      .text(data.summary, 72, 205, {
        width: contentWidth,
        align: "justify",
        lineGap: 3,
      });

    let y = doc.y + 20;

    // --- Services table ---
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("Identified Services", 72, y);

    y += 22;

    const colX = [72, 200, 290, 380, 470];
    const colW = [128, 90, 90, 90, 80];

    // Header row
    doc.rect(72, y, contentWidth, 22).fill(light);
    doc.fillColor(dark).fontSize(9).font("Helvetica-Bold");
    const headers = ["Service", "Provider", "Category", "Monthly Cost", "Share"];
    headers.forEach((h, i) => {
      doc.text(h, colX[i], y + 7, { width: colW[i], align: "left" });
    });

    y += 22;

    // Data rows
    doc.font("Helvetica").fontSize(9).fillColor("#414042");
    data.services.forEach((s, idx) => {
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 72;
      }
      if (idx % 2 === 1) {
        doc.rect(72, y, contentWidth, 20).fill("#f8f8f8");
      }
      doc.fillColor("#414042");
      doc.text(s.name, colX[0], y + 6, { width: colW[0] });
      doc.text(s.provider, colX[1], y + 6, { width: colW[1] });
      doc.text(s.category, colX[2], y + 6, { width: colW[2] });
      doc.text(fmtCurrency(s.monthlyCost), colX[3], y + 6, {
        width: colW[3],
        align: "right",
      });
      doc.text(fmtPct(s.percentage), colX[4], y + 6, {
        width: colW[4],
        align: "right",
      });
      y += 20;
    });

    // Border around table
    doc
      .rect(72, y - data.services.length * 20 - 22, contentWidth, data.services.length * 20 + 22)
      .strokeColor(border)
      .lineWidth(0.5)
      .stroke();

    y += 25;

    // --- Cost projections ---
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 72;
    }

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("Cost Projections at Scale", 72, y);

    y += 22;

    doc.rect(72, y, contentWidth, 22).fill(light);
    doc.fillColor(dark).fontSize(9).font("Helvetica-Bold");
    doc.text("Scale", colX[0], y + 7, { width: 200 });
    doc.text("Users", colX[2], y + 7, { width: 90 });
    doc.text("Monthly Cost", colX[3], y + 7, { width: 90, align: "right" });

    y += 22;

    doc.font("Helvetica").fontSize(9).fillColor("#414042");
    data.projections.forEach((p, idx) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 72;
      }
      if (idx % 2 === 1) {
        doc.rect(72, y, contentWidth, 20).fill("#f8f8f8");
      }
      doc.fillColor("#414042");
      doc.text(p.label, colX[0], y + 6, { width: 200 });
      doc.text(p.users.toLocaleString(), colX[2], y + 6, { width: 90 });
      doc.text(fmtCurrency(p.totalCost), colX[3], y + 6, {
        width: 90,
        align: "right",
      });
      y += 20;
    });

    y += 25;

    // --- Optimizations ---
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 72;
    }

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("Optimization Recommendations", 72, y);

    y += 22;

    data.optimizations.forEach((o, idx) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 72;
      }

      // Card background
      const cardH = 60;
      doc
        .rect(72, y, contentWidth, cardH)
        .fillAndStroke(light, border);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(dark)
        .text(o.title, 82, y + 8, { width: contentWidth - 20 });

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(muted)
        .text(
          `${o.category}  •  Effort: ${o.effort}  •  Saves ${fmtCurrency(o.savingsPerMonth)}/mo`,
          82,
          y + 24,
          { width: contentWidth - 20 }
        );

      doc
        .fontSize(8)
        .fillColor("#58595b")
        .text(o.description, 82, y + 38, {
          width: contentWidth - 20,
          height: 18,
          ellipsis: true,
        });

      y += cardH + 8;
    });

    // --- Total savings callout ---
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 72;
    }

    y += 10;
    doc.rect(72, y, contentWidth, 50).fill(accent);
    doc
      .fillColor("#ffffff")
      .fontSize(11)
      .font("Helvetica")
      .text("Total Identified Savings", 82, y + 10, { width: 250 });
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(`${fmtCurrency(data.totalSavings)}/month`, 82, y + 25, {
        width: 250,
      });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#d4f8e4")
      .text(
        `Projected at 100K users: ${fmtCurrency(data.totalMonthlyAt100k)}/month`,
        330,
        y + 18,
        { width: contentWidth - 260, align: "right" }
      );

    y += 70;

    // --- Signature block ---
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 72;
    }

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(dark)
      .text("Acknowledgement", 72, y);

    y += 20;
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(muted)
      .text(
        "By signing below, I acknowledge that I have reviewed this cost analysis report.",
        72,
        y
      );

    y += 30;
    doc
      .moveTo(72, y)
      .lineTo(300, y)
      .strokeColor(border)
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(8)
      .fillColor(muted)
      .text("Signature", 72, y + 4);

    doc
      .moveTo(340, y)
      .lineTo(468, y)
      .strokeColor(border)
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(8)
      .fillColor(muted)
      .text("Date", 340, y + 4);

    // --- Footer ---
    doc
      .fontSize(7)
      .fillColor(muted)
      .text(
        "Generated by CloudCost AI • Powered by Doctavian e-signature",
        72,
        doc.page.height - 40,
        { width: contentWidth, align: "center" }
      );

    doc.end();
  });
}
