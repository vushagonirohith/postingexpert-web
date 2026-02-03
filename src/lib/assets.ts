// src/lib/assets.ts
import { apiFetch } from "@/lib/api";

export type AssetType = "image" | "pdf";

export type UserAsset = {
  userId: string;
  createdAt: string; // your SK: "2026-02-02T...Z#<uuid>"
  assetId: string;
  bucket: string;
  cdnUrl: string;
  meta_format?: string; // "png" / "pdf"
  region?: string;
  s3Key: string;
  slideIndex?: number | string;
  theme?: string;
  type: AssetType;
};

export type ListAssetsResponse = {
  items: UserAsset[];
  nextCursor?: any; // optional (if your backend supports pagination)
};

/**
 * 🔧 IMPORTANT:
 * Change this path to match whatever you already built in backend.
 * Examples:
 * - "/assets/list"
 * - "/media/list"
 * - "/user/assets"
 */
export const LIST_ASSETS_PATH = "/user/assets";

export async function listMyAssets(token: string): Promise<ListAssetsResponse> {
  // Recommended: backend should infer userId from token (best security).
  const data = await apiFetch(LIST_ASSETS_PATH, {
    method: "GET",
    token,
    base: "gateway",
  });

  // Normalize common shapes
  const body = (data?.body && typeof data.body === "object") ? data.body : data;
  return {
    items: body?.items || body?.data || body || [],
    nextCursor: body?.nextCursor || body?.lastEvaluatedKey || undefined,
  };
}
