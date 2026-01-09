// src/lib/api.js

// ✅ Main API Gateway / Lambda Router (Auth, Profile, Status etc.)
export const GATEWAY_BASE = (
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  process.env.NEXT_PUBLIC_LAMBDA_URL ||
  "https://aomkmgl9zj.execute-api.ap-south-1.amazonaws.com/prod"
).replace(/\/$/, "");

// ✅ Enqueue Gateway (Start-EC2-on-demand Lambda) — ONLY for /queue/enqueue
// Set in .env: NEXT_PUBLIC_ENQUEUE_BASE_URL="https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod"
export const ENQUEUE_BASE = (
  process.env.NEXT_PUBLIC_ENQUEUE_BASE_URL || ""
).replace(/\/$/, "");

// ✅ EC2 direct base (keep only for local/dev debugging; browser HTTPS cannot call HTTP EC2)
export const EC2_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.233.45.167:5000"
).replace(/\/$/, "");

// Legacy export
export const API_BASE = GATEWAY_BASE;

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Decide which backend should handle the request.
 * - /queue/enqueue => StartEC2 gateway (ENQUEUE_BASE)
 * - /queue/status/* => main gateway (GATEWAY_BASE) to avoid EC2 wakeups
 * - everything else => main gateway
 */
function pickBaseForPath(path) {
  const p = normalizePath(path);

  if (p === "/queue/enqueue") return "enqueue";
  if (p.startsWith("/queue/status/")) return "gateway";

  return "gateway";
}

function resolveBaseUrl(chosen) {
  if (chosen === "enqueue") {
    // If not configured yet, fallback safely to main gateway (no runtime error)
    if (!ENQUEUE_BASE) {
      if (typeof window !== "undefined") {
        console.warn(
          "⚠️ NEXT_PUBLIC_ENQUEUE_BASE_URL not set. Falling back to GATEWAY_BASE for /queue/enqueue."
        );
      }
      return GATEWAY_BASE;
    }
    return ENQUEUE_BASE;
  }

  if (chosen === "ec2") return EC2_BASE;
  return GATEWAY_BASE;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return null;

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { raw: text };
  }

  // ✅ If Lambda proxy returns { statusCode, body: "json-string" }
  if (data && typeof data === "object" && typeof data.body === "string") {
    const b = data.body.trim();
    if ((b.startsWith("{") && b.endsWith("}")) || (b.startsWith("[") && b.endsWith("]"))) {
      try {
        data.body = JSON.parse(b);
      } catch {
        // keep as string if parse fails
      }
    }
  }

  return data;
}


/**
 * ✅ DEFAULT JSON API
 * options.base: "gateway" | "enqueue" | "ec2"
 */
export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers: extraHeaders = {},
    base, // optional override
  } = options;

  const finalPath = normalizePath(path);
  const chosen = base || pickBaseForPath(finalPath);
  const BASE = resolveBaseUrl(chosen);

  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE}${finalPath}`;
  console.log(`🔵 API Request: ${method} ${url} (base=${chosen})`);

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    console.error(`❌ API Error: ${msg}`, { status: res.status, url, data });
    throw new Error(msg);
  }

  console.log(`✅ API Success: ${res.status} (base=${chosen})`);
  return data;
}

/**
 * ✅ MULTIPART API
 * options.base: "gateway" | "enqueue" | "ec2"
 */
export async function apiUpload(path, options = {}) {
  const { method = "POST", formData, token, base } = options;

  const finalPath = normalizePath(path);
  const chosen = base || pickBaseForPath(finalPath);
  const BASE = resolveBaseUrl(chosen);

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE}${finalPath}`;
  console.log(`🔵 Upload Request: ${method} ${url} (base=${chosen})`);

  const res = await fetch(url, {
    method,
    headers,
    body: formData,
    cache: "no-store",
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    console.error(`❌ Upload Error: ${msg}`, { status: res.status, url, data });
    throw new Error(msg);
  }

  console.log(`✅ Upload Success: ${res.status} (base=${chosen})`);
  return data;
}
