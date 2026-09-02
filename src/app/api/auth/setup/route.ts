/**
 * Auth setup — starts the Microsoft device code flow.
 *
 * GET /api/auth/setup
 *   Returns the device code, user code, and verification URL.
 *   The user visits the URL, enters the code, and logs in.
 *   Then the frontend polls /api/auth/poll?deviceCode=...
 *
 * This is a one-time setup. Once the refresh token is cached,
 * getAccessToken() refreshes silently — no further user action needed.
 */

import { NextResponse } from "next/server";
import { requestDeviceCode, getTokenStatus } from "@/lib/msal-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = getTokenStatus();
    if (status.hasToken && !status.isExpired) {
      return NextResponse.json({
        status: "already_authenticated",
        expiresAt: status.expiresAt,
        message: "Token is already cached and valid. No setup needed.",
      });
    }

    const deviceCode = await requestDeviceCode();
    return NextResponse.json({
      status: "device_code_pending",
      userCode: deviceCode.user_code,
      verificationUri: deviceCode.verification_uri,
      deviceCode: deviceCode.device_code,
      expiresIn: deviceCode.expires_in,
      interval: deviceCode.interval,
      message: deviceCode.message,
    });
  } catch (error) {
    console.error("[auth/setup] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
