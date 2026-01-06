// src/app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = (
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  process.env.NEXT_PUBLIC_LAMBDA_URL ||
  "https://4fqbpp1yya.execute-api.ap-south-1.amazonaws.com/prod"
).replace(/\/$/, "");

// Optional: if you ever set gateway without /prod, you can define stage:
const STAGE = process.env.NEXT_PUBLIC_API_STAGE || "prod";

function buildTargetUrl(req: NextRequest, pathParts: string[]) {
  // Incoming: /api/user/login  -> forward to: {GATEWAY_BASE}/user/login (if GATEWAY_BASE already has /prod)
  // If user set GATEWAY_BASE WITHOUT /prod, we add /prod automatically.
  const incomingPath = "/" + pathParts.join("/");

  const baseHasStage = new RegExp(`/${STAGE}$`).test(GATEWAY_BASE) || new RegExp(`/${STAGE}/`).test(GATEWAY_BASE);
  const base = baseHasStage ? GATEWAY_BASE : `${GATEWAY_BASE}/${STAGE}`;

  const url = new URL(base + incomingPath);

  // preserve query params
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  return url.toString();
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;

  // Handle preflight quickly
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const targetUrl = buildTargetUrl(req, path);

  // Copy headers (keep Authorization!)
  const headers = new Headers(req.headers);
  headers.delete("host"); // important
  // Let fetch set correct content-length
  headers.delete("content-length");

  // Body: only for non-GET/HEAD
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  // Return upstream response as-is
  const resBody = await upstream.arrayBuffer();
  const resHeaders = new Headers(upstream.headers);

  // Ensure JSON content-type if upstream forgot it
  if (!resHeaders.get("content-type")) {
    resHeaders.set("content-type", "application/json");
  }

  return new NextResponse(resBody, {
    status: upstream.status,
    headers: resHeaders,
  });
}

// Export all methods
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
