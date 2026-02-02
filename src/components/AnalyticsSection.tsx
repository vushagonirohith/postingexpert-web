// src/components/AnalyticsSection.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import HubSpotCRMService, { Analytics } from "@/lib/hubspotCRM";

const COLORS = [
  "hsl(var(--primary))",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
];

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
}

function getIdentity() {
  // ✅ priority: explicit stored email
  const userEmail = (localStorage.getItem("userEmail") || "").trim();

  // username might be "Poorna" (not email)
  const username = (localStorage.getItem("username") || "").trim();

  // sometimes you stored "registeredUserId"
  const registeredUserId = (localStorage.getItem("registeredUserId") || "").trim();

  // If username itself is an email, treat it as email
  const email = userEmail || (isEmail(username) ? username : "");

  // userId fallback
  const userId = registeredUserId || (email ? "" : username);

  return { email, userId };
}

export default function AnalyticsSection() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");
  const [refreshMessage, setRefreshMessage] = useState<string>("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      setRefreshMessage("");

      const { email, userId } = getIdentity();

      // If we still don't have anything, show clear error
      if (!email && !userId) {
        setError("User identity missing. Please login again.");
        setAnalytics(null);
        return;
      }

      const data = await HubSpotCRMService.getAnalytics({ email, userId });
      setAnalytics(data);
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      const m = String(err?.message || "");

      // Better UX message for timeouts
      if (m.toLowerCase().includes("timeout")) {
        setError("Analytics is taking too long (server warming up). Please click Refresh once more.");
      } else {
        setError(m || "Failed to load analytics");
      }
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ “Fake refresh” = just refetch analytics (no /refresh_engagement)
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      setRefreshMessage("Refreshing analytics…");

      await fetchAnalytics();

      try {
        localStorage.setItem("analytics_last_refreshed_at", new Date().toLocaleString());
      } catch {}

      setRefreshMessage("✅ Updated.");
      setTimeout(() => setRefreshMessage(""), 1500);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const engagementSummary = analytics?.engagement_summary ?? {
    total_impressions: 0,
    total_likes: 0,
    total_comments: 0,
    total_shares: 0,
  };

  const totalEngagement =
    engagementSummary.total_likes +
    engagementSummary.total_comments +
    engagementSummary.total_shares;

  const avgEngagement =
    analytics && analytics.total_posts > 0
      ? Math.round(totalEngagement / analytics.total_posts)
      : 0;

  const platforms = analytics?.posts_by_platform ?? [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="h-5 w-52 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-7 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-72 w-full animate-pulse rounded-2xl bg-muted" />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Performance Analytics</p>
            <p className="mt-1 text-xs text-muted-foreground">
              If this is your first login, server may take a bit to respond.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">Overview of your published content</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Refresh analytics"
        >
          {refreshing ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v6h6M20 20v-6h-6M20 9a8 8 0 0 0-14.9-3M4 15a8 8 0 0 0 14.9 3"
              />
            </svg>
          )}
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {refreshMessage ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-foreground">{refreshMessage}</p>
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Posts" value={(analytics?.total_posts ?? 0).toLocaleString()} subtitle="All time" />
        <KpiCard title="Total Engagement" value={totalEngagement.toLocaleString()} subtitle="Likes + Comments + Shares" />
        <KpiCard title="Avg. Engagement" value={avgEngagement.toLocaleString()} subtitle="Per post" />
        <KpiCard
          title="Active Platforms"
          value={(platforms?.length ?? 0).toString()}
          subtitle={platforms.map((p) => p.platform).join(", ") || "—"}
        />
      </div>

      {/* Platform Chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-5 text-sm font-medium text-muted-foreground">Platform Distribution</h3>

        <div className="h-72">
          {platforms.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platforms}
                  dataKey="count"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ percent }) => (percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : "")}
                  labelLine={false}
                >
                  {platforms.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} posts`, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    padding: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: "0.875rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-2xl border border-border/60 bg-background/40 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Create your first post to see distribution.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Recent Posts</h3>

        {analytics?.recent_posts?.length ? (
          <div className="space-y-4">
            {analytics.recent_posts.slice(0, 5).map((post, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/60 bg-background p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2 text-sm">{post.caption || "No caption provided"}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • {post.platform}
                    </p>
                  </div>

                  {post.post_url ? (
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      View →
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Publish a post to populate analytics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}
