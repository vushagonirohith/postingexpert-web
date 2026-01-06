// src/lib/api.js

// ✅ API Gateway / Lambda (Auth etc.)
export const GATEWAY_BASE = (
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  process.env.NEXT_PUBLIC_LAMBDA_URL ||
  "https://4fqbpp1yya.execute-api.ap-south-1.amazonaws.com/prod"
).replace(/\/$/, "");

// ✅ EC2 Flask (direct access - NOT safe from HTTPS browser)
export const EC2_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.233.45.167:5000"
).replace(/\/$/, "");

// ✅ Same-origin proxy (works in production HTTPS)
export const PROXY_BASE = "";

export const API_BASE = GATEWAY_BASE;

/**
 * ✅ DEFAULT JSON API
 * options.base: "gateway" | "ec2" | "proxy"
 */
export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers: extraHeaders = {},
    base = "gateway",
  } = options;

  // 🔧 Use proxy for queue endpoints when on production
  let actualBase = base;
  if (typeof window !== "undefined" && 
      window.location.protocol === "https:" && 
      path.startsWith("/queue/")) {
    actualBase = "proxy";
    console.log("🔄 Using Next.js proxy for queue endpoint");
  }

  const BASE =
    actualBase === "proxy" ? PROXY_BASE : 
    actualBase === "ec2" ? EC2_BASE : 
    GATEWAY_BASE;

  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`🔵 API Request: ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    console.error(`❌ API Error: ${msg}`, data);
    throw new Error(msg);
  }

  console.log(`✅ API Success: ${res.status}`);
  return data;
}

/**
 * ✅ MULTIPART API
 * options.base: "gateway" | "ec2" | "proxy"
 */
export async function apiUpload(path, options = {}) {
  const { method = "POST", formData, token, base = "gateway" } = options;

  // 🔧 Use proxy for queue endpoints when on production
  let actualBase = base;
  if (typeof window !== "undefined" && 
      window.location.protocol === "https:" && 
      path.startsWith("/queue/")) {
    actualBase = "proxy";
    console.log("🔄 Using Next.js proxy for queue upload");
  }

  const BASE =
    actualBase === "proxy" ? PROXY_BASE : 
    actualBase === "ec2" ? EC2_BASE : 
    GATEWAY_BASE;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`🔵 Upload Request: ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: formData,
    cache: "no-store",
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    console.error(`❌ Upload Error: ${msg}`, data);
    throw new Error(msg);
  }

  console.log(`✅ Upload Success: ${res.status}`);
  return data;
}