/**
 * Auth status — returns the current token cache status.
 *
 * GET /api/auth/status
 *   Returns whether a token is cached, when it expires, and whether setup is needed.
 *   Used by the UI to show auth status and prompt for setup if needed.
 */

import { NextResponse } from "next/server";
import { getTokenStatus } from "@/lib/msal-auth";

export const runtime = "nodejs";

export async function GET() {
  const status = getTokenStatus();
  return NextResponse.json(status);
}
