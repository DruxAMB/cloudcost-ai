/**
 * Xano backend client: calls the Xano API endpoints that power CloudCost AI.
 *
 * Sponsor: Xano: Rebuild a SaaS Tool You Hate ($2,500 prize)
 * Integration: Xano is the backend: it handles data persistence (analysis history),
 * API routing (the frontend calls Xano, not Next.js directly), and orchestrates
 * external API calls (SerpApi + Gemini via the Next.js API routes).
 */

const XANO_API_BASE = process.env.NEXT_PUBLIC_XANO_API_BASE || "https://xbnq-wyp3-syty.n7e.xano.io/api:cloudcost";

export interface XanoAnalysisRecord {
  id: number;
  created_at: string;
  app_description: string;
  summary: string;
  estimated_complexity: string;
  analysis_data: unknown;
  pricing_source: string;
  total_monthly_cost?: number;
  total_annual_cost?: number;
  service_count?: number;
}

/**
 * Call the Xano analyze endpoint.
 * Xano receives the app description, calls the Next.js API (which uses SerpApi + Gemini),
 * stores the result in the Xano database, and returns the analysis.
 */
export async function xanoAnalyze(description: string): Promise<{
  analysis: unknown;
  recordId: number;
  storedAt: string;
}> {
  const response = await fetch(`${XANO_API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Xano analyze failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    analysis: data,
    recordId: data.id,
    storedAt: data.storedAt,
  };
}

/**
 * List past analyses from the Xano database.
 */
export async function xanoListAnalyses(page = 1, perPage = 20): Promise<{
  items: XanoAnalysisRecord[];
}> {
  const response = await fetch(
    `${XANO_API_BASE}/analysis/list?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );

  if (!response.ok) {
    throw new Error(`Xano list failed: ${response.status}`);
  }

  const data = await response.json();
  return { items: data.items || data };
}

/**
 * Get a specific analysis by ID from the Xano database.
 */
export async function xanoGetAnalysis(id: number): Promise<XanoAnalysisRecord> {
  const response = await fetch(`${XANO_API_BASE}/analysis/get?id=${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Xano get failed: ${response.status}`);
  }

  return response.json();
}
