// src/hooks/useRequireSubscription.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearAuth } from "@/lib/auth";

const BILLING_API =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BILLING_API_URL) || "";

const CACHE_KEY    = "pe_sub_status";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedStatus = { active: boolean; status: string; cachedAt: number };

function readCache(): CachedStatus | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStatus = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function writeCache(active: boolean, status: string) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ active, status, cachedAt: Date.now() }));
  } catch {}
}

type Result = {
  ready:          boolean;  // true = logged in (page should render)
  subscribed:     boolean;  // true = active subscription
  checking:       boolean;  // true = still loading
};

/**
 * Use this in every gated page:
 *
 *   const { ready, subscribed, checking } = useRequireSubscription("studio");
 *   if (!ready || checking) return null;
 *   // Render page content + show PaywallOverlay if !subscribed
 */
export function useRequireSubscription(from = ""): Result {
  const router = useRouter();
  const [ready,      setReady]      = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [checking,   setChecking]   = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // 1. Must be logged in
      const token = getToken();
      if (!token) {
        clearAuth();
        router.replace("/login");
        return;
      }

      setReady(true); // logged in — page background can render

      // 2. Get userId from JWT
      let userId = "";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.username || payload.sub || payload.user_id || "";
      } catch {}

      if (!userId) {
        // Can't check without userId — don't block
        if (!cancelled) { setSubscribed(true); setChecking(false); }
        return;
      }

      // 3. Check sessionStorage cache
      const cached = readCache();
      if (cached) {
        if (!cancelled) { setSubscribed(cached.active); setChecking(false); }
        return;
      }

      // 4. No cache — hit billing API
      try {
        if (!BILLING_API) {
          // Billing API not configured — dev mode, don't block
          if (!cancelled) { setSubscribed(true); setChecking(false); }
          return;
        }

        const res = await fetch(
          `${BILLING_API}/billing/status?userId=${encodeURIComponent(userId)}`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (!res.ok) {
          // API error — don't block user
          if (!cancelled) { setSubscribed(true); setChecking(false); }
          return;
        }

        const data = await res.json();
        const isActive = !!data.active;
        writeCache(isActive, data.status || "unknown");

        if (!cancelled) { setSubscribed(isActive); setChecking(false); }
      } catch {
        // Network error — don't block
        if (!cancelled) { setSubscribed(true); setChecking(false); }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [router, from]);

  return { ready, subscribed, checking };
}