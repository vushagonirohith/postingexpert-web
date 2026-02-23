// src/app/analytics/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

/* ===================== TYPES ===================== */
type AnalyticsSummary = {
  total_likes: number;
  total_comments: number;
  unique_users: number;
  repeat_engagers: number;
  days_filter?: number | null;
  post_filter?: string | null;
};

type Funnel = { cold: number; warm: number; hot: number };

type TopEngager = {
  actor: string;
  likes: number;
  comments: number;
  score: number;
  level: "cold" | "warm" | "hot";
  last_seen: number;
};

type PostBreakdownRow = {
  post_urn: string;
  likes: number;
  comments: number;
  unique_users: number;
};

type AnalyticsPayload = {
  summary: AnalyticsSummary;
  funnel: Funnel;
  top_engagers: TopEngager[];
  post_breakdown: PostBreakdownRow[];
};

type ApiResponse = {
  ok: boolean;
  user_id: string;
  token_check?: { ok: boolean; via?: string; data?: any };
  analytics?: AnalyticsPayload;
  post_urn?: string;
  message?: string;
  note?: string;
  error?: string;
};

/* ===================== CONFIG ===================== */
const API_BASE =
  "https://d4sdg4usz2.execute-api.ap-south-1.amazonaws.com/lileads";
const PATH = "/api/linkedinleads";
const HARDCODED_POST_URN = "";

/* ===================== HELPERS ===================== */
function safeLocalStorageGet(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function fmtTs(ts?: number) {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    const needs = /[",\n]/.test(s);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function linkedinSearchUrl(query: string) {
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
    query
  )}`;
}

async function callApi(url: string, token?: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const errMsg =
      json?.error || json?.message || `Request failed (${res.status})`;
    throw new Error(errMsg);
  }

  return json as ApiResponse;
}

/* ===================== ICONS ===================== */
function IconCopy({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 9h11v12H9V9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconOpen({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 5h5v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14 19 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19 14v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ===================== CHARTS (SVG) ===================== */
function DonutChart({
  valueA,
  valueB,
  labelA,
  labelB,
}: {
  valueA: number;
  valueB: number;
  labelA: string;
  labelB: string;
}) {
  const total = Math.max(0, valueA) + Math.max(0, valueB);
  const pctA = total ? Math.round((valueA / total) * 100) : 0;

  // Pastel + contrast (theme aligned)
  const colA = "rgba(167, 139, 250, 0.55)"; // Likes (light lavender)
  const colB = "rgba(99, 102, 241, 0.88)"; // Comments (darker indigo)

  // ✅ Dynamic size: bigger on desktop, smaller on mobile
  // Tailwind sizes:
  // - mobile: 140px
  // - md+: 170px
  const sizeClass = "h-[140px] w-[140px] md:h-[170px] md:w-[170px]";

  // Chart geometry scales with viewBox; circle radius fixed in viewBox space
  const r = 44;
  const c = 2 * Math.PI * r;
  const aLen = total ? (valueA / total) * c : 0;
  const bLen = c - aLen;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
      {/* Donut */}
      <div className="flex flex-col items-center">
        <div className={`relative ${sizeClass}`}>
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke="rgba(148,163,184,0.35)"
              strokeWidth="14"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke={colA}
              strokeWidth="14"
              fill="none"
              strokeDasharray={`${aLen} ${c}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              stroke={colB}
              strokeWidth="14"
              fill="none"
              strokeDasharray={`${bLen} ${c}`}
              strokeDashoffset={-aLen}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
        </div>

        {/* ✅ Text BELOW donut (not inside) */}
        <div className="mt-3 text-center">
          <div className="text-2xl font-semibold">{pctA}%</div>
          <div className="text-xs text-muted-foreground">{labelA}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full max-w-sm space-y-2 text-sm">
        <LegendRow color={colA} label={labelA} value={valueA} />
        <LegendRow color={colB} label={labelB} value={valueB} />
        <div className="pt-2 text-xs text-muted-foreground">
          Total: <span className="text-foreground font-medium">{total}</span>
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium text-foreground">{value}</span>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = max ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "rgba(167, 139, 250, 0.55)",
          }}
        />
      </div>
    </div>
  );
}

function PostStackedBars({ rows }: { rows: PostBreakdownRow[] }) {
  const top = rows.slice(0, 6);
  const maxTotal = Math.max(
    1,
    ...top.map((r) => (r.likes || 0) + (r.comments || 0))
  );

  const likesCol = "rgba(167, 139, 250, 0.55)";
  const commentsCol = "rgba(99, 102, 241, 0.88)";

  return (
    <div className="space-y-4">
      {top.map((r) => {
        const total = (r.likes || 0) + (r.comments || 0);
        const wLikes = (r.likes / maxTotal) * 100;
        const wComments = (r.comments / maxTotal) * 100;

        return (
          <div
            key={r.post_urn}
            className="rounded-2xl border border-border bg-background/40 p-5"
          >
            <div className="text-xs text-muted-foreground break-all">
              {r.post_urn}
            </div>

            <div className="mt-3 h-3 rounded-full bg-muted/30 overflow-hidden flex">
              <div style={{ width: `${wLikes}%`, background: likesCol }} />
              <div style={{ width: `${wComments}%`, background: commentsCol }} />
            </div>

            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>
                Likes:{" "}
                <span className="text-foreground font-medium">{r.likes}</span>
              </span>
              <span>
                Comments:{" "}
                <span className="text-foreground font-medium">
                  {r.comments}
                </span>
              </span>
              <span className="ml-auto">
                Total:{" "}
                <span className="text-foreground font-medium">{total}</span>
              </span>
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="rounded-2xl border border-border bg-background/40 p-6 text-sm text-muted-foreground">
          No post breakdown found.
        </div>
      )}
    </div>
  );
}

/* ===================== SKELETONS ===================== */
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-muted/30 ${className}`}
      aria-hidden="true"
    />
  );
}

function SkeletonPage() {
  return (
    <div className="mt-10 space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-4 h-10 w-20" />
          <SkeletonBlock className="mt-4 h-3 w-28" />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="mt-4 h-10 w-20" />
          <SkeletonBlock className="mt-4 h-3 w-32" />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="mt-4 h-10 w-20" />
          <SkeletonBlock className="mt-4 h-3 w-24" />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="mt-4 h-10 w-20" />
          <SkeletonBlock className="mt-4 h-3 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-4 h-3 w-56" />
          <div className="mt-6 flex items-center gap-6">
            <SkeletonBlock className="h-[170px] w-[170px] rounded-full" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-4 h-3 w-44" />
          <div className="mt-6 space-y-4">
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
            <SkeletonBlock className="h-16 w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="mt-4 h-3 w-64" />
        <div className="mt-6 space-y-4">
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ===================== PAGE ===================== */
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"idle" | "fetching" | "analytics">("idle");
  const [msg, setMsg] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);

  const [days, setDays] = useState<string>("all");
  const [postUrn, setPostUrn] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("last_seen");

  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<any>(null);

  const analytics = data?.analytics || null;

  const headlineName = useMemo(() => {
    const first = data?.token_check?.data?.localizedFirstName || "";
    const last = data?.token_check?.data?.localizedLastName || "";
    const full = `${first} ${last}`.trim();
    return full || data?.user_id || "Your Account";
  }, [data]);

  function showToast(t: string) {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1400);
  }

  const postOptions = useMemo(() => {
    const rows = analytics?.post_breakdown || [];
    const unique = Array.from(new Set(rows.map((r) => r.post_urn))).filter(Boolean);
    return unique;
  }, [analytics]);

  const filteredEngagers = useMemo(() => {
    const rows = analytics?.top_engagers || [];
    const q = search.trim().toLowerCase();

    let out = rows;
    if (q) out = out.filter((r) => (r.actor || "").toLowerCase().includes(q));

    out = [...out].sort((a, b) => {
      if (sort === "likes") return (b.likes || 0) - (a.likes || 0);
      if (sort === "comments") return (b.comments || 0) - (a.comments || 0);
      return (b.last_seen || 0) - (a.last_seen || 0);
    });

    return out;
  }, [analytics, search, sort]);

  async function runOptionAPipeline(params?: { days?: string; postUrn?: string }) {
    setLoading(true);
    setMsg("");
    setData(null);

    const userId =
      safeLocalStorageGet("postingexpert_user_id") ||
      safeLocalStorageGet("username");

    if (!userId) {
      setMsg("User not found. Please login again.");
      setLoading(false);
      return;
    }

    const token = safeLocalStorageGet("token");

    const base = new URLSearchParams();
    base.set("user_id", userId);
    if (HARDCODED_POST_URN) base.set("post_urn", HARDCODED_POST_URN);

    const d = params?.days ?? days;
    const p = params?.postUrn ?? postUrn;

    setStage("fetching");
    const fetchQs = new URLSearchParams(base);
    fetchQs.set("action", "fetch");
    const fetchUrl = `${API_BASE}${PATH}?${fetchQs.toString()}`;
    await callApi(fetchUrl, token);

    setStage("analytics");
    const aQs = new URLSearchParams(base);
    aQs.set("action", "analytics");
    if (d !== "all") aQs.set("days", d);
    if (p !== "all") aQs.set("post_urn", p);

    const analyticsUrl = `${API_BASE}${PATH}?${aQs.toString()}`;
    const res = await callApi(analyticsUrl, token);

    setData(res);
    setStage("idle");
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (cancelled) return;
        await runOptionAPipeline();
      } catch (e: any) {
        if (!cancelled) {
          setMsg(e?.message || "Failed to load analytics.");
          setStage("idle");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters() {
    try {
      await runOptionAPipeline({ days, postUrn });
    } catch (e: any) {
      setMsg(e?.message || "Failed to apply filters.");
      setStage("idle");
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!analytics) return;

    const summaryRows = [
      {
        user: data?.user_id || "",
        total_likes: analytics.summary.total_likes,
        total_comments: analytics.summary.total_comments,
        unique_engagers: analytics.summary.unique_users,
        repeat_engagers: analytics.summary.repeat_engagers,
        days_filter: analytics.summary.days_filter ?? "",
        post_filter: analytics.summary.post_filter ?? "",
      },
    ];

    const postRows = (analytics.post_breakdown || []).map((r) => ({
      post_urn: r.post_urn,
      likes: r.likes,
      comments: r.comments,
      unique_users: r.unique_users,
    }));

    const engagerRows = (analytics.top_engagers || []).map((r) => ({
      actor_urn: r.actor,
      likes: r.likes,
      comments: r.comments,
      last_seen: r.last_seen,
      last_seen_readable: fmtTs(r.last_seen),
    }));

    const csv =
      "### SUMMARY\n" +
      toCSV(summaryRows) +
      "\n\n### POST_BREAKDOWN\n" +
      toCSV(postRows) +
      "\n\n### ENGAGERS\n" +
      toCSV(engagerRows);

    downloadText("linkedin_analytics.csv", csv);
    showToast("Exported CSV");
  }

  const maxSignal = useMemo(() => {
    if (!analytics) return 1;
    return Math.max(
      1,
      analytics.summary.total_likes,
      analytics.summary.total_comments,
      analytics.summary.unique_users,
      analytics.summary.repeat_engagers
    );
  }, [analytics]);

  return (
    <>
      <SiteNavbar />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Analytics</p>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  LinkedIn Engagement Analytics
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Showing engagement intelligence for:{" "}
                  <span className="text-foreground font-medium">
                    {headlineName}
                  </span>
                </p>
                {loading && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {stage === "fetching"
                      ? "Fetching LinkedIn engagement and storing into DynamoDB..."
                      : stage === "analytics"
                      ? "Reading analytics from DynamoDB..."
                      : "Loading..."}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => applyFilters()}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted/30 disabled:opacity-50"
                  disabled={loading}
                  title="Apply filters (fetch → analytics)"
                >
                  Apply
                </button>

                <button
                  onClick={() =>
                    runOptionAPipeline().catch((e) =>
                      setMsg(e?.message || "Failed to refresh")
                    )
                  }
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition hover:bg-muted/30 disabled:opacity-50"
                  disabled={!analytics || loading}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-2">
                <Label>Days</Label>
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none"
                >
                  <option value="all">All</option>
                  <option value="7">Last 7</option>
                  <option value="30">Last 30</option>
                </select>
              </div>

              <div className="md:col-span-5">
                <Label>Post</Label>
                <select
                  value={postUrn}
                  onChange={(e) => setPostUrn(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none"
                >
                  <option value="all">All</option>
                  {postOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Post list is auto-built from stored breakdown.
                </p>
              </div>

              <div className="md:col-span-3">
                <Label>Sort</Label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none"
                >
                  <option value="last_seen">Last Seen</option>
                  <option value="likes">Likes</option>
                  <option value="comments">Comments</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Search</Label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="actor urn..."
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {loading && <SkeletonPage />}

          {!loading && msg && (
            <div className="mt-10 rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
              {msg}
            </div>
          )}

          {!loading && !msg && !analytics && (
            <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
              <p className="text-sm text-muted-foreground">
                No analytics returned yet.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Your API returned ok but missing <code>analytics</code>.
              </p>
            </div>
          )}

          {!loading && analytics && (
            <>
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
                <KpiCard title="Total Likes" value={analytics.summary.total_likes} />
                <KpiCard
                  title="Total Comments"
                  value={analytics.summary.total_comments}
                />
                <KpiCard
                  title="Unique Engagers"
                  value={analytics.summary.unique_users}
                />
                <KpiCard
                  title="Repeat Engagers"
                  value={analytics.summary.repeat_engagers}
                />
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <h2 className="text-lg font-medium">Engagement Mix</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Likes vs Comments (pastel + contrast).
                  </p>

                  <div className="mt-6">
                    <DonutChart
                      valueA={analytics.summary.total_likes}
                      valueB={analytics.summary.total_comments}
                      labelA="Likes"
                      labelB="Comments"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                  <h2 className="text-lg font-medium">Key Signals</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clean indicators you can act on.
                  </p>

                  <div className="mt-6 space-y-4">
                    <ProgressBar
                      label="Total Likes"
                      value={analytics.summary.total_likes}
                      max={maxSignal}
                    />
                    <ProgressBar
                      label="Total Comments"
                      value={analytics.summary.total_comments}
                      max={maxSignal}
                    />
                    <ProgressBar
                      label="Unique Engagers"
                      value={analytics.summary.unique_users}
                      max={maxSignal}
                    />
                    <ProgressBar
                      label="Repeat Engagers"
                      value={analytics.summary.repeat_engagers}
                      max={maxSignal}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <MiniKpi
                        label="Engagement / Engager"
                        value={(
                          (analytics.summary.total_likes +
                            analytics.summary.total_comments) /
                          Math.max(1, analytics.summary.unique_users)
                        ).toFixed(2)}
                      />
                      <MiniKpi
                        label="Repeat Rate"
                        value={`${Math.round(
                          (analytics.summary.repeat_engagers /
                            Math.max(1, analytics.summary.unique_users)) *
                            100
                        )}%`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 rounded-3xl border border-border bg-card p-8 shadow-sm">
                <h2 className="text-lg font-medium">Post Breakdown</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Top posts by total engagement (stacked likes + comments).
                </p>

                <div className="mt-6">
                  <PostStackedBars rows={analytics.post_breakdown || []} />
                </div>
              </div>

              <div className="mt-12 rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-lg font-medium">Engagers</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      LinkedIn does not provide emails/phones from likes/comments.
                      Actor URN is the stable identifier.
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Showing:{" "}
                    <span className="text-foreground font-medium">
                      {filteredEngagers.length}
                    </span>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium">Actor URN</th>
                        <th className="px-4 py-3 text-left font-medium">Likes</th>
                        <th className="px-4 py-3 text-left font-medium">Comments</th>
                        <th className="px-4 py-3 text-left font-medium">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEngagers.map((e, idx) => (
                        <tr
                          key={`${e.actor}-${idx}`}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <div className="max-w-[560px] break-all text-muted-foreground">
                                {e.actor}
                              </div>

                              <button
                                className="mt-[2px] inline-flex items-center justify-center rounded-full border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                title="Copy URN"
                                onClick={async () => {
                                  try {
                                    await copyToClipboard(e.actor);
                                    showToast("Copied");
                                  } catch {
                                    showToast("Copy failed");
                                  }
                                }}
                              >
                                <IconCopy />
                              </button>

                              <a
                                className="mt-[2px] inline-flex items-center justify-center rounded-full border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                title="Open in LinkedIn search"
                                href={linkedinSearchUrl(e.actor)}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <IconOpen />
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-3">{e.likes}</td>
                          <td className="px-4 py-3">{e.comments}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {fmtTs(e.last_seen)}
                          </td>
                        </tr>
                      ))}

                      {filteredEngagers.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-10 text-center text-muted-foreground"
                          >
                            No engagers match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
                <h3 className="text-sm font-medium text-foreground">
                  How this page works
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Option A pipeline: this page always runs{" "}
                  <code>action=fetch</code> first (store fresh engagement into DynamoDB),
                  then runs <code>action=analytics</code> (read from DynamoDB and render).
                </p>
              </div>
            </>
          )}
        </div>

        <SiteFooter />
      </main>
    </>
  );
}

/* ===================== UI COMPONENTS ===================== */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-muted-foreground">{children}</div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}