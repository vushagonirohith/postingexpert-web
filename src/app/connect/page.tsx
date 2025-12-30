"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { getToken, clearAuth } from "@/lib/auth";

type Profile = {
  username?: string;
  name?: string;
  email?: string;
  business_type?: string;
  connected_accounts?: number;
  scheduled_time?: string;
  posts_created?: number;
  has_logo?: boolean;
  logo_s3_url?: string;
  created_at?: number;
  updated_at?: number;
  [k: string]: any;
};

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return safeJsonParse(json);
  } catch {
    return null;
  }
}

function normalizeProfile(raw: any): Profile {
  let data: any = raw;

  // Some gateways wrap responses like { body: "..." }
  if (data?.body && typeof data.body === "string") {
    const parsed = safeJsonParse(data.body);
    if (parsed) data = parsed;
  }

  const p = data?.user || data?.profile || data || {};

  return {
    ...p,
    username: p.username ?? data?.username,
    name: p.name ?? data?.name,
    email: p.email ?? data?.email,
    business_type: p.business_type ?? data?.business_type,
    scheduled_time: p.scheduled_time ?? data?.scheduled_time,
    posts_created: p.posts_created ?? data?.posts_created ?? 0,
    connected_accounts: p.connected_accounts ?? data?.connected_accounts ?? 0,
    has_logo: p.has_logo ?? data?.has_logo ?? false,
    logo_s3_url: p.logo_s3_url ?? data?.logo_s3_url ?? "",
  };
}

function buildFallbackProfile(token: string): Profile {
  const payload = decodeJwtPayload(token) || {};

  const lsUsername =
    localStorage.getItem("username") ||
    localStorage.getItem("registeredUserId") ||
    "";

  const lsBusinessType =
    localStorage.getItem("business_type") ||
    localStorage.getItem("businessType") ||
    "";

  const profile: Profile = {
    username: payload.username || lsUsername || "User",
    name: payload.name || "",
    email: payload.email || "",
    business_type: lsBusinessType || "Not specified",
    scheduled_time: "Not set",
    posts_created: 0,
    connected_accounts: 0,
    has_logo: false,
    logo_s3_url: "",
  };

  return profile;
}

function isAuthErrorMessage(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("401") ||
    m.includes("403") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("token")
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);

      // ✅ Most likely mapping for your backend function get_profile()
      // Keep /user/profile as a second try (your earlier request showed /user/profile = 404)
      const endpoints = ["/user/get_profile", "/user/profile"];

      for (const ep of endpoints) {
        try {
          const data = await apiFetch(ep, { token });
          const normalized = normalizeProfile(data);
          setProfile(normalized);
          setLoading(false);
          return;
        } catch (e: any) {
          const msg = e?.message || "";

          // 404 endpoint missing → try next endpoint
          if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
            continue;
          }

          // Real auth error → logout
          if (isAuthErrorMessage(msg)) {
            clearAuth();
            router.replace("/login");
            return;
          }

          // Other errors → don't logout; fallback
          console.warn("Profile load error:", msg);
          break;
        }
      }

      // ✅ Fallback so details still show even if profile endpoint is missing
      setProfile(buildFallbackProfile(token));
      setLoading(false);
    };

    load();
  }, [ready, router]);

  const displayName = useMemo(() => {
    if (!profile) return "User";
    return profile.name || profile.username || "User";
  }, [profile]);

  const connectedCount = profile?.connected_accounts ?? 0;

  if (!ready) return null;

  return (
    <>
      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-14">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Connect</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Your workspace is ready.
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              One-time setup. After this, PostingExpert runs quietly in the background.
            </p>
          </div>

          {/* Top cards */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Workspace */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Workspace</p>
              <p className="mt-2 text-xl font-semibold">{displayName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.email || "—"}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Business type</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile?.business_type || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground">Auto schedule</p>
                  <p className="mt-1 text-sm font-medium">
                    {profile?.scheduled_time || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Status</p>

              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Connected accounts</p>
                <p className="mt-1 text-2xl font-semibold">{connectedCount}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Posts created</p>
                <p className="mt-1 text-2xl font-semibold">
                  {profile?.posts_created ?? 0}
                </p>
              </div>
            </div>

            {/* Brand assets */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Brand assets</p>

              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Logo</p>
                <p className="mt-1 text-sm font-medium">
                  {profile?.has_logo ? "Uploaded" : "Not uploaded"}
                </p>

                {profile?.logo_s3_url ? (
                  <a
                    href={profile.logo_s3_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm underline underline-offset-4"
                  >
                    View logo
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Upload later (we’ll guide you).
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* What next */}
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next steps</p>
                <h2 className="mt-2 text-xl font-semibold">
                  What you can do next
                </h2>

                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Connect your platforms once (secure)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Generate content & visuals in AI Studio
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Auto Mode publishes while you focus on business
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/studio")}
                  className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Open AI Studio
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-full border border-border bg-background px-6 py-3 text-sm font-medium transition hover:bg-muted"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>

            {/* Platforms */}
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              <PlatformCard
                title="LinkedIn"
                desc="Company page or profile posting"
                onClick={() => router.push("/connect/linkedin")}
              />
              <PlatformCard
                title="Instagram"
                desc="Auto post images + captions"
                onClick={() => router.push("/connect/instagram")}
              />
              <PlatformCard
                title="Facebook"
                desc="Pages + scheduled posting"
                onClick={() => router.push("/connect/facebook")}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Logged in securely. Token stored locally.
              </p>

              <button
                onClick={() => {
                  clearAuth();
                  router.push("/login");
                }}
                className="rounded-full border border-border bg-background px-5 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <SiteFooter />
      </main>
    </>
  );
}

function PlatformCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-background p-6">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>

      <button
        onClick={onClick}
        className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        Connect
      </button>
    </div>
  );
}
