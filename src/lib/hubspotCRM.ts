// src/lib/hubspotCRM.ts
import axios, { AxiosError } from "axios";

export type Analytics = {
  total_posts: number;
  posts_by_platform: { platform: string; count: number }[];
  engagement_summary: {
    total_impressions: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
  };
  recent_posts: Array<{
    caption: string;
    platform: string;
    created_at: string;
    post_url?: string;
    deal_id?: string | number;
    post_urn?: string;
  }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  "https://94t4hgejt7.execute-api.ap-south-1.amazonaws.com/prod";

// ✅ axios with bigger timeout (EC2 warmup / slow backend safe)
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // ✅ 30s (was 10s)
  headers: { "Content-Type": "application/json" },
});

// -------- helpers --------
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildIdentityParams(input: { email?: string; userId?: string }) {
  const email = (input.email || "").trim();
  const user_id = (input.userId || "").trim();

  // Send BOTH when possible (backend can decide what it uses)
  const params: any = {};
  if (email) params.email = email;
  if (user_id) params.user_id = user_id;

  return params;
}

export default class HubSpotCRMService {
  // ✅ You can still keep createContact if you want, but analytics is the focus now.

  static async getAnalytics(identity: { email?: string; userId?: string }): Promise<Analytics> {
    const params = buildIdentityParams(identity);

    // If nothing to query, return empty object shape
    if (!params.email && !params.user_id) {
      return {
        total_posts: 0,
        posts_by_platform: [],
        engagement_summary: {
          total_impressions: 0,
          total_likes: 0,
          total_comments: 0,
          total_shares: 0,
        },
        recent_posts: [],
      };
    }

    // ✅ retry because EC2 warmup / slow first call is common
    const maxAttempts = 3;
    let lastErr: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await http.get<Analytics>("/crm/analytics", { params });

        // Backend might return null/empty; normalize
        const data: any = res.data || {};
        return {
          total_posts: Number(data.total_posts || 0),
          posts_by_platform: Array.isArray(data.posts_by_platform) ? data.posts_by_platform : [],
          engagement_summary: data.engagement_summary || {
            total_impressions: 0,
            total_likes: 0,
            total_comments: 0,
            total_shares: 0,
          },
          recent_posts: Array.isArray(data.recent_posts) ? data.recent_posts : [],
        };
      } catch (error) {
        lastErr = error;

        const ax = error as AxiosError<any>;
        const msg =
          ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          ax?.message ||
          "Failed to fetch analytics";

        console.error(`❌ Analytics attempt ${attempt}/${maxAttempts}:`, msg);

        // Backoff before retry
        if (attempt < maxAttempts) await sleep(800 * attempt);
      }
    }

    // If all attempts fail, throw last error
    throw lastErr || new Error("Failed to fetch analytics");
  }

  // OPTIONAL: keep createContact if you already use it
  static async createContact(email: string, name: string, userId?: string) {
    try {
      const payload = {
        email,
        name,
        user_id: userId || name,
      };
      const res = await http.post("/crm/contact", payload);
      return res.data;
    } catch (error) {
      const ax = error as AxiosError<any>;
      console.error("❌ createContact error:", ax?.response?.data || ax?.message);
      throw error;
    }
  }
}
