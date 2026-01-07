// src/app/connect/page.tsx
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

  // ✅ from your get_profile()
  color_theme?: string;
  has_logo?: boolean;
  logo_s3_url?: string;
  logo_filename?: string;
  profile_image?: string;

  [k: string]: any;
};

type SocialStatus = {
  instagram: boolean;
  linkedin: boolean;
  facebook: boolean;
};

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeLambdaWrapped(raw: any) {
  // backend may wrap response like: { body: "..." }
  if (raw?.body && typeof raw.body === "string") {
    const parsed = safeJsonParse(raw.body);
    if (parsed) return parsed;
  }
  return raw;
}

function normalizeProfile(raw: any): Profile {
  const data = normalizeLambdaWrapped(raw);
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

    // ✅ survey-related fields returned by your get_profile()
    color_theme: p.color_theme ?? data?.color_theme,
    has_logo: p.has_logo ?? data?.has_logo,
    logo_s3_url: p.logo_s3_url ?? data?.logo_s3_url,
    logo_filename: p.logo_filename ?? data?.logo_filename,
    profile_image: p.profile_image ?? data?.profile_image,
  };
}

function isAuthErrorMessage(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("401") ||
    m.includes("403") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("token") ||
    m.includes("authorization")
  );
}

export default function ConnectPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [social, setSocial] = useState<SocialStatus>({
    instagram: false,
    linkedin: false,
    facebook: false,
  });
  const [loading, setLoading] = useState(true);

  const reloadAll = async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    // ✅ app_user is required by your get_social_status()
    const appUser =
      localStorage.getItem("username") ||
      localStorage.getItem("registeredUserId") ||
      "";

    setLoading(true);

    try {
      const [profileRaw, socialRaw] = await Promise.all([
        apiFetch("/user/profile", { method: "GET", token }),
        apiFetch(`/user/social-status?app_user=${encodeURIComponent(appUser)}`, {
          method: "GET",
          token,
        }),
      ]);

      // ✅ profile includes survey fields from UserSurveyData already
      setProfile(normalizeProfile(profileRaw));

      // ✅ your get_social_status returns: { connected: { instagram, linkedin, facebook, ... } }
      const socialData = normalizeLambdaWrapped(socialRaw);
      const connected = socialData?.connected || {};

      setSocial({
        instagram: !!connected.instagram,
        linkedin: !!connected.linkedin,
        facebook: !!connected.facebook,
      });
    } catch (e: any) {
      const msg = e?.message || "";

      if (isAuthErrorMessage(msg)) {
        clearAuth();
        router.replace("/login");
        return;
      }

      // fallback (still let user see connect page)
      setProfile({
        username: localStorage.getItem("username") || "User",
        email: "",
        business_type: "Not specified",
        scheduled_time: "Not set",
        posts_created: 0,
        connected_accounts: 0,
        has_logo: false,
        logo_s3_url: "",
        logo_filename: "",
      });

      setSocial({ instagram: false, linkedin: false, facebook: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // ✅ After OAuth callback redirect, status can update slightly later
  useEffect(() => {
    if (!ready) return;

    const hasOAuthParams =
      typeof window !== "undefined" &&
      (window.location.search.includes("code=") ||
        window.location.search.includes("state="));

    if (!hasOAuthParams) return;

    const t = setTimeout(() => reloadAll(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const displayName = useMemo(() => {
    if (!profile) return "User";
    return profile.name || profile.username || "User";
  }, [profile]);

  // ✅ Real connected count from get_social_status()
  const connectedCount = useMemo(() => {
    return [social.instagram, social.linkedin, social.facebook].filter(Boolean)
      .length;
  }, [social]);

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
              One-time setup. After this, PostingExpert runs quietly in the
              background.
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
                <p className="text-xs text-muted-foreground">
                  Connected accounts
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {loading ? "—" : `${connectedCount}/3`}
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

                {profile?.has_logo && profile?.logo_s3_url ? (
                  <a
                    href={profile.logo_s3_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-medium underline"
                  >
                    View logo {profile.logo_filename ? `(${profile.logo_filename})` : ""}
                  </a>
                ) : (
                  <p className="mt-1 text-sm font-medium">
                    Upload later (we’ll guide you).
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={reloadAll}
                className="mt-4 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                Refresh status
              </button>
            </div>
          </div>

          {/* Connect buttons */}
          <ConnectClient profile={profile} />
        </div>

        <SiteFooter />
      </main>
    </>
  );
}
