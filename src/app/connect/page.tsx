//src/app/connect/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { apiFetch } from "@/lib/api";
import { getToken, clearAuth } from "@/lib/auth";
import ConnectClient from "./ConnectClient";

type Profile = {
  username?: string;
  name?: string;
  email?: string;
  business_type?: string;
  connected_accounts?: number;
  scheduled_time?: string;
  posts_created?: number;
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

function normalizeProfile(raw: any): Profile {
  let data: any = raw;

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
  };
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

          if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
            continue;
          }

          if (isAuthErrorMessage(msg)) {
            clearAuth();
            router.replace("/login");
            return;
          }

          break;
        }
      }

      // minimal fallback
      setProfile({
        username: localStorage.getItem("username") || "User",
        email: "",
        business_type: "Not specified",
        scheduled_time: "Not set",
        posts_created: 0,
        connected_accounts: 0,
      });
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
                <p className="mt-1 text-2xl font-semibold">
                  {loading ? "—" : connectedCount}
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Posts created</p>
                <p className="mt-1 text-2xl font-semibold">
                  {loading ? "—" : profile?.posts_created ?? 0}
                </p>
              </div>
            </div>

            {/* Brand assets */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Brand assets</p>

              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Logo</p>
                <p className="mt-1 text-sm font-medium">Upload later (we’ll guide you).</p>
              </div>
            </div>
          </div>

          {/* ✅ This section now includes the REAL LinkedIn connect button */}
          <ConnectClient profile={profile} />
        </div>

        <SiteFooter />
      </main>
    </>
  );
}