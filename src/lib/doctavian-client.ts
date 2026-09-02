/**
 * Doctavian API client: PDF document upload + digital signature envelopes.
 *
 * Sponsor: Doctavian: Generate It Right. Sign It Tight. ($1,000 prize)
 *
 * Integration approach:
 *   Doctavian's document generation engine (Maven Mule) requires DOCX templates
 *   built with their Word Add-in for expression elements. Programmatically
 *   generated DOCX files are rejected with TEMPLATE_READ_FAILED.
 *
 *   Instead, we generate the cost report PDF ourselves (pdfkit) and use
 *   Doctavian's signature envelope workflow — the part that works reliably
 *   via API — to send it for legally binding e-signature.
 *
 * API flow:
 *   1. Upload PDF to signature storage (POST /signatures/document/upload)
 *   2. Create envelope with document + recipient + signature fields
 *      (POST /signatures/envelope/create)
 *   3. Send envelope to recipient (GET /signatures/envelope/{id}/send)
 *   4. Recipient receives email, reviews, and signs via Doctavian's web UI
 *
 * Auth: X-Api-Key (APIM gateway) + Authorization: Bearer JWT (app layer).
 * The JWT is a Microsoft OAuth token obtained via the device code flow
 * (see msal-auth.ts). A refresh token is cached on disk so the access
 * token is silently renewed before every API call — no manual refresh
 * needed.
 */

import { getAccessToken } from "./msal-auth";

const API_BASE = process.env.DOCTAVIAN_API_BASE || "https://demo.api.doctavian.com";
const API_KEY = process.env.DOCTAVIAN_API_KEY || "";
const SENDER_NAME = process.env.DOCTAVIAN_SENDER_NAME || "CloudCost AI";
const SENDER_EMAIL = process.env.DOCTAVIAN_SENDER_EMAIL || "";

if (!API_KEY) {
  console.warn("[doctavian] DOCTAVIAN_API_KEY not set — Doctavian integration will fail");
}

/**
 * Build the standard headers for Doctavian API calls.
 * Fetches a fresh access token (from cache or via refresh) on every call.
 */
async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();
  return {
    "X-Api-Key": API_KEY,
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

// --- Types ---

export interface DoctavianUploadResponse {
  result: {
    data: {
      files: Array<{ id: string; fileName: string }>;
    };
    statusCode: number;
    message: string;
  };
  origin: string;
  dateTime: string;
  operationId: string | null;
}

export interface DoctavianEnvelopeResponse {
  result: {
    statusCode: number;
    message: string;
    data: {
      envelope: { id: string; uploadDate: string; status: string };
      documents: Array<{ id: string; externalContext?: unknown }>;
      recipients: Array<{ id: string; externalContext?: unknown }>;
      signGroups: Array<{ id: string }>;
      fields: Array<{ id: string; recipientId?: string; documentId: string }>;
    };
  };
  origin: string;
  dateTime: string;
  consumption?: Array<{ dimension: string; value: number }>;
  externalContext?: unknown;
}

export interface DoctavianSendResponse {
  result: { statusCode: number; message: string };
  origin: string;
  dateTime: string;
  consumption?: Array<{ dimension: string; value: number }>;
}

export interface DoctavianReportResult {
  documentUrn: string;
  documentName: string;
  documentFormat: string;
  envelopeId: string;
  envelopeStatus: string;
  signed: boolean;
  consumption: Array<{ dimension: string; value: number }>;
  generatedAt: string;
}

// --- API methods ---

/**
 * Upload a PDF document to the signature service Storage.
 * X-Storage-Type: document-input selects the signature-side container.
 */
export async function uploadSignatureDocument(
  pdfBuffer: Buffer,
  fileName: string
): Promise<DoctavianUploadResponse> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  formData.append("file", blob, fileName);

  const resp = await fetch(`${API_BASE}/v1/signatures/document/upload`, {
    method: "POST",
    headers: await buildHeaders({ "X-Storage-Type": "document-input" }),
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Signature document upload failed (${resp.status}): ${text}`);
  }

  return resp.json();
}

/**
 * Create a signature envelope (draft) with a document, recipient, and
 * signature fields positioned on the last page.
 *
 * The envelope is not sent until sendEnvelope() is called.
 */
export async function createEnvelope(params: {
  documentUrn: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  subject: string;
  message: string;
  pageCount?: number;
}): Promise<DoctavianEnvelopeResponse> {
  const signPage = params.pageCount ?? 1;

  const body = {
    documents: [
      {
        referenceDocumentId: 1,
        name: params.documentName,
        loadMethod: "storage",
        urn: params.documentUrn,
      },
    ],
    recipients: [
      {
        referenceSignerId: 1,
        name: params.signerName,
        email: params.signerEmail,
        role: "signer",
        mandatory: true,
      },
    ],
    fields: [
      {
        referenceSignerId: 1,
        referenceDocumentId: 1,
        name: "Signature",
        type: "signature",
        page: signPage,
        positionX: 72,
        positionY: 680,
        width: 228,
        height: 40,
        isRequired: true,
      },
      {
        referenceSignerId: 1,
        referenceDocumentId: 1,
        name: "Date",
        type: "text",
        page: signPage,
        positionX: 340,
        positionY: 680,
        width: 128,
        height: 40,
        isRequired: true,
      },
    ],
    envelope: {
      subject: params.subject,
      message: params.message,
      senderName: SENDER_NAME,
      senderEmail: SENDER_EMAIL || params.signerEmail,
      isSignOrder: false,
      expireInDays: 30,
      notifyWhenOpened: true,
      notifyWhenSigned: true,
      locale: "en_US_POSIX",
      timezone: "(GMT-07:00) Pacific Time (US & Canada)",
    },
  };

  const resp = await fetch(`${API_BASE}/v1/signatures/envelope/create`, {
    method: "POST",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Envelope creation failed (${resp.status}): ${text}`);
  }

  return resp.json();
}

/**
 * Send a draft envelope to its recipients for signature.
 * Triggers email notification to the signer.
 */
export async function sendEnvelope(envelopeId: string): Promise<DoctavianSendResponse> {
  const resp = await fetch(
    `${API_BASE}/v1/signatures/envelope/${envelopeId}/send`,
    {
      method: "GET",
      headers: await buildHeaders(),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Envelope send failed (${resp.status}): ${text}`);
  }

  return resp.json();
}

/**
 * Full pipeline: upload a pre-generated PDF and send it for e-signature.
 *
 *   1. Upload the PDF to signature storage
 *   2. Create a signature envelope with the document + recipient + fields
 *   3. Send the envelope — recipient gets an email from Doctavian
 *
 * The PDF is generated by the caller (see src/lib/pdf-report.ts) so this
 * function is format-agnostic — any PDF buffer works.
 */
export async function uploadAndSendForSignature(params: {
  pdfBuffer: Buffer;
  pdfFileName: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  pageCount?: number;
}): Promise<DoctavianReportResult> {
  // Step 1: Upload PDF to signature storage
  const uploadResp = await uploadSignatureDocument(
    params.pdfBuffer,
    params.pdfFileName
  );
  const documentUrn = uploadResp.result.data.files[0].id;

  // Step 2: Create envelope
  const envelopeResp = await createEnvelope({
    documentUrn,
    documentName: params.documentName,
    signerName: params.signerName,
    signerEmail: params.signerEmail,
    subject: `Cost Analysis Report: ${params.documentName}`,
    message:
      "Please review and sign the attached cost analysis report generated by CloudCost AI.",
    pageCount: params.pageCount,
  });

  const envelopeId = envelopeResp.result.data.envelope.id;
  const consumption = envelopeResp.consumption || [];

  // Step 3: Send envelope
  const sendResp = await sendEnvelope(envelopeId);

  return {
    documentUrn,
    documentName: params.documentName,
    documentFormat: "pdf",
    envelopeId,
    envelopeStatus: /sent/i.test(sendResp.result.message) ? "Sent" : "Draft",
    signed: false,
    consumption: [...consumption, ...(sendResp.consumption || [])],
    generatedAt: new Date().toISOString(),
  };
}
