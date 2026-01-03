// src/lib/api.js

// ✅ Use API Gateway (Lambda) as the default base so it can start EC2 when stopped
const API_BASE =
  (process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_LAMBDA_URL ||
    "https://4fqbpp1yya.execute-api.ap-south-1.amazonaws.com/prod"
  ).replace(/\/$/, "");

/**
 * ✅ DEFAULT JSON API
 */
export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
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
 */
export async function apiUpload(path, { method = "POST", formData, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`🔵 Upload Request: ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers, // browser sets boundary
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

export { API_BASE };
