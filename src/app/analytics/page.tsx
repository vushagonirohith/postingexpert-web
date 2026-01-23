"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AnalyticsSection from "@/components/AnalyticsSection";

type QuickStats = {
  connectedCount: number;
  totalPlatforms: number;
  lastRefreshedAt?: string;
};

function getConnectedCountFromStorage(): number {
  try {
    const raw = localStorage.getItem("connectedPlatforms");
    if (!raw) return 0;

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed.length;
    if (parsed?.connected && Array.isArray(parsed.connected)) return parsed.connected.length;

    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter(Boolean).length;
    }

    return 0;
  } catch {
    return 0;
  }
}

function getLastRefreshFromStorage(): string | undefined {
  try {
    const v = localStorage.getItem("analytics_last_refreshed_at");
    return v || undefined;
  } catch {
    return undefined;
  }
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<QuickStats>({
    connectedCount: 0,
    totalPlatforms: 3,
    lastRefreshedAt: undefined,
  });

  useEffect(() => {
    setMounted(true);
    setStats({
      connectedCount: getConnectedCountFromStorage(),
      lastRefreshedAt: getLastRefreshFromStorage(),
    });
  }, []);

  const connectedLabel = useMemo(() => {
    return `${stats.connectedCount}/${stats.totalPlatforms}`;
  }, [stats.connectedCount, stats.totalPlatforms]);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Track your post performance across connected platforms. Refresh data anytime.
            </p>

            {/* Back */}
            <div className="mt-4 flex items-center gap-3 text-sm">
              {/* ✅ Your “dashboard” is /connect in your app */}
              <Link
                href="/connect"
                className="rounded-full border px-3 py-1.5 hover:bg-muted transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border px-3 py-1.5 text-sm">
              Connected:{" "}
              <span className="font-medium">{mounted ? connectedLabel : "—"}</span>
            </div>

            <div className="rounded-full border px-3 py-1.5 text-sm">
              Last refresh:{" "}
              <span className="font-medium">
                {mounted ? stats.lastRefreshedAt || "Not yet" : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Main analytics */}
        <div className="mt-8">
          <AnalyticsSection />
        </div>

        {/* Footer note */}
        <div className="mt-10 rounded-2xl border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Tip: To test analytics before posting from AI Studio, you can seed posts via the HubSpot CRM API.
          </p>
        </div>
      </div>
    </div>
  );
}
