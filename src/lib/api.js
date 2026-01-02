// src/lib/api.js

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://13.233.45.167:5000";

/**
 * ✅ DEFAULT JSON API (unchanged)
 * Used everywhere in your app
 */
export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

/**
 * ✅ MULTIPART API (ONLY when image/file is attached)
 * Does NOT affect existing APIs
 */
export async function apiUpload(
  path,
  { method = "POST", formData, token } = {}
) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers, // ❗ DO NOT set Content-Type (browser sets boundary)
    body: formData,
  });

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}
