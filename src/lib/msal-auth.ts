/**
 * Microsoft OAuth integration for Doctavian.
 *
 * Doctavian uses Microsoft Account (MSA) OAuth for user identity. The access
 * token expires every ~1 hour. This module implements the device code flow
 * to obtain a refresh token once, then silently refreshes the access token
 * on every API call — so the integration stays alive indefinitely.
 *
 * Flow:
 *   1. User visits /api/auth/setup → device code flow starts
 *   2. User goes to Microsoft URL, enters the code, logs in
 *   3. /api/auth/poll?deviceCode=... → polls until complete, stores tokens
 *   4. getAccessToken() → returns cached token or refreshes if expired
 *   5. doctavian-client.ts calls getAccessToken() before every API call
 *
 * Config derived from the Doctavian portal's JWT claims:
 *   - clientId: Azure CLI's well-known public client (supports device code
 *     flow for any Azure AD resource; the Doctavian portal's SPA client
 *     does not support device code)
 *   - tenant: 9188040d-6c67-4c5b-b112-36a304b66dad (MSA consumers)
 *   - scope: 40728276-52a7-4932-bf32-76737f1fd01a/API.Access offline_access
 *     (resource app ID / scope name from the JWT's aud + scp claims;
 *     offline_access is required to receive a refresh token)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Config ──────────────────────────────────────────────────────────────

// Azure CLI's well-known public client ID — registered as a mobile/desktop
// app, supports device code flow for any Azure AD resource.
const CLIENT_ID =
  process.env.DOCTAVIAN_OAUTH_CLIENT_ID || "04b07795-8ddb-461a-bbee-02f9e1bf7b46";
const TENANT_ID =
  process.env.DOCTAVIAN_OAUTH_TENANT_ID || "9188040d-6c67-4c5b-b112-36a304b66dad";
const SCOPE =
  process.env.DOCTAVIAN_OAUTH_SCOPE ||
  "40728276-52a7-4932-bf32-76737f1fd01a/API.Access offline_access";

const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const DEVICE_CODE_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`;

// Token cache — stored outside the repo in .msal-cache/
const CACHE_DIR = join(process.cwd(), ".msal-cache");
const CACHE_FILE = join(CACHE_DIR, "token-cache.json");

// ── Token cache ──────────────────────────────────────────────────────────

interface TokenCacheData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
  obtainedAt: number; // unix seconds
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCache(): TokenCacheData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    let raw = readFileSync(CACHE_FILE, "utf-8");
    // Strip UTF-8 BOM if present (PowerShell Out-File adds one)
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw) as TokenCacheData;
  } catch {
    return null;
  }
}

function writeCache(data: TokenCacheData) {
  ensureCacheDir();
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Types ────────────────────────────────────────────────────────────────

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export interface TokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  id_token?: string;
}

export interface TokenError {
  error: string;
  error_description: string;
  error_codes: number[];
  timestamp: string;
  trace_id: string;
  correlation_id: string;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Step 1: Request a device code from Microsoft.
 * Returns a URL for the user to visit and a code to enter.
 */
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: SCOPE,
  });

  const res = await fetch(DEVICE_CODE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Device code request failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return data as DeviceCodeResponse;
}

/**
 * Step 2: Poll the token endpoint with the device code.
 * Returns the token response once the user completes the flow,
 * or throws with error "authorization_pending" if still waiting.
 */
export async function pollDeviceCode(deviceCode: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    client_id: CLIENT_ID,
    device_code: deviceCode,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw data as TokenError;
  }

  // Store in cache
  const now = Math.floor(Date.now() / 1000);
  const cacheData: TokenCacheData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: now + data.expires_in,
    obtainedAt: now,
  };
  writeCache(cacheData);

  return data as TokenResponse;
}

/**
 * Get a valid access token. Uses the cached token if not expired
 * (with a 5-minute buffer), or refreshes it using the refresh token.
 *
 * This is the function the Doctavian client calls before every API request.
 */
export async function getAccessToken(): Promise<string> {
  const cache = readCache();

  if (!cache) {
    throw new Error(
      "DOCTAVIAN_AUTH_NEEDED: No token in cache. Visit /api/auth/setup to start authentication."
    );
  }

  // If token is still valid (with 5 min buffer), return it
  const now = Math.floor(Date.now() / 1000);
  if (cache.accessToken && cache.expiresAt - now > 300) {
    return cache.accessToken;
  }

  // Token expired — refresh using the refresh token
  if (!cache.refreshToken) {
    throw new Error(
      "DOCTAVIAN_AUTH_NEEDED: Token expired and no refresh token available. Visit /api/auth/setup to re-authenticate."
    );
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    scope: SCOPE,
    refresh_token: cache.refreshToken,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    // Refresh token might be expired — need to re-authenticate
    throw new Error(
      `DOCTAVIAN_AUTH_NEEDED: Token refresh failed: ${data.error || "unknown"} — ${data.error_description || ""}. Visit /api/auth/setup to re-authenticate.`
    );
  }

  // Update cache
  const newCache: TokenCacheData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || cache.refreshToken,
    expiresAt: now + data.expires_in,
    obtainedAt: now,
  };
  writeCache(newCache);

  return data.access_token;
}

/**
 * Check if we have a valid cached token (for UI status display).
 */
export function getTokenStatus(): {
  hasToken: boolean;
  expiresAt: number | null;
  isExpired: boolean;
  needsSetup: boolean;
} {
  const cache = readCache();
  if (!cache) {
    return { hasToken: false, expiresAt: null, isExpired: true, needsSetup: true };
  }
  const now = Math.floor(Date.now() / 1000);
  return {
    hasToken: true,
    expiresAt: cache.expiresAt,
    isExpired: cache.expiresAt - now <= 300,
    needsSetup: false,
  };
}
