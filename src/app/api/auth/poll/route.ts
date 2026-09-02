/**
 * Auth poll — polls the Microsoft token endpoint for device code completion.
 *
 * GET /api/auth/poll?deviceCode=...
 *   Returns the token if the user has completed the flow,
 *   or { status: "pending" } if still waiting.
 */

import { NextRequest, NextResponse } from "next/server";
import { pollDeviceCode } from "@/lib/msal-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceCode = searchParams.get("deviceCode");

    if (!deviceCode) {
      return NextResponse.json(
        { error: "Missing deviceCode parameter" },
        { status: 400 }
      );
    }

    try {
      const token = await pollDeviceCode(deviceCode);
      return NextResponse.json({
        status: "success",
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        message: "Authentication successful. Token cached for future use.",
      });
    } catch (err: unknown) {
      const error = err as { error?: string; error_description?: string };
      if (error.error === "authorization_pending") {
        return NextResponse.json({
          status: "pending",
          message: "User has not yet completed the authentication flow.",
        });
      }
      if (error.error === "slow_down") {
        return NextResponse.json({
          status: "pending",
          message: "Polling too fast. Will retry with longer interval.",
        });
      }
      if (error.error === "expired_token") {
        return NextResponse.json(
          { status: "expired", error: "Device code expired. Start a new flow." },
          { status: 410 }
        );
      }
      if (error.error === "access_denied") {
        return NextResponse.json(
          { status: "denied", error: "User denied the authentication request." },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("[auth/poll] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
