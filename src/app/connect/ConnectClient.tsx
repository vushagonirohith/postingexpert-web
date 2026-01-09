// src/app/connect/ConnectClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";  // ← New import
import LinkedInConnectClient from "./linkedin/LinkedInConnectClient";

type SocialDetail = Record<string, any> | null;

type SocialStatusResponse = {
  instagram?: { connected?: boolean; detail?: SocialDetail };
  linkedin?: { connected?: boolean; detail?: SocialDetail };
  facebook?: { connected?: boolean; detail?: SocialDetail };
};

type ProfileLite = {
  username?: string;
  email?: string;
  business_type?: string;
  connected_accounts?: number;
  posts_created?: number;
  scheduled_time?: string;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getAppUser(profile?: ProfileLite | null) {
  return (
    profile?.username ||
    (typeof window !== "undefined" ? localStorage.getItem("username") : "") ||
    (typeof window !== "undefined"
      ? localStorage.getItem("registeredUserId")
      : "") ||
    ""
  );
}

// Instagram (FB dialog/oauth) — same as you had
function buildInstagramAuthUrl(appUser: string) {
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || "";
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || "";
  if (!clientId || !redirectUri) return null;

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ];

  return (
    "https://www.facebook.com/v21.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(appUser)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(","))}`
  );
}

// Facebook dialog/oauth
function buildFacebookAuthUrl(appUser: string) {
  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "";
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || "";
  if (!clientId || !redirectUri) return null;

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
    "pages_manage_engagement",
    "public_profile",
  ];

  return (
    "https://www.facebook.com/v21.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(appUser)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(","))}`
  );
}

function openCenteredPopup(url: string, title: string) {
  const w = 520;
  const h = 720;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;

  return window.open(
    url,
    title,
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,status=1`
  );
}

export default function ConnectClient({ profile }: { profile: ProfileLite | null }) {
  const router = useRouter();

  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [social, setSocial] = useState({
    instagram: { connected: false, detail: null as SocialDetail },
    linkedin: { connected: false, detail: null as SocialDetail },
    facebook: { connected: false, detail: null as SocialDetail },
  });

  // Optimistic UI so badge doesn’t show "Not connected" immediately after callback
  const [igUiConnected, setIgUiConnected] = useState(false);
  const [fbUiConnected, setFbUiConnected] = useState(false);

  const appUser = useMemo(() => getAppUser(profile), [profile?.username]);

  const isInstagramConnected = social.instagram.connected || igUiConnected;
  const isFacebookConnected = social.facebook.connected || fbUiConnected;

  const connectedCount = useMemo(() => {
    const li = social.linkedin.connected;
    const ig = isInstagramConnected;
    const fb = isFacebookConnected;
    return [li, ig, fb].filter(Boolean).length;
  }, [social.linkedin.connected, isInstagramConnected, isFacebookConnected]);

  const fetchSocialStatus = async () => {
    const token = getToken();
    if (!token) {
      setToast("❌ Missing token. Please login again.");
      return;
    }
    if (!appUser) {
      setToast("❌ app_user missing. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/user/social_status", {
        method: "GET",
        token,
        query: { app_user: appUser },
      });

      const next = {
        instagram: {
          connected: Boolean(data.instagram?.connected),
          detail: data.instagram?.detail || null,
        },
        linkedin: {
          connected: Boolean(data.linkedin?.connected),
          detail: data.linkedin?.detail || null,
        },
        facebook: {
          connected: Boolean(data.facebook?.connected),
          detail: data.facebook?.detail || null,
        },
      };

      setSocial(next);

      // Reset optimistic flags if backend confirms
      if (next.instagram.connected) setIgUiConnected(false);
      if (next.facebook.connected) setFbUiConnected(false);
    } catch (e: any) {
      setToast(`❌ Failed to fetch social status: ${e?.message || "Network error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appUser) return;
    fetchSocialStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  // Listen to popup callbacks (instagram_callback/facebook_callback/linkedin_callback)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;

      if (msg.type === "instagram_callback") {
        if (msg.success) {
          setToast("✅ Instagram connected!");
          setIgUiConnected(true);
        } else {
          setToast(`❌ Instagram: ${msg.error || "Connection failed"}`);
          setIgUiConnected(false);
        }
        fetchSocialStatus();
      }

      if (msg.type === "facebook_callback") {
        if (msg.success) {
          setToast("✅ Facebook connected!");
          setFbUiConnected(true);
        } else {
          setToast(`❌ Facebook: ${msg.error || "Connection failed"}`);
          setFbUiConnected(false);
        }
        fetchSocialStatus();
      }

      if (msg.type === "linkedin_callback") {
        setToast(msg.success ? "✅ LinkedIn connected!" : `❌ LinkedIn: ${msg.error || "Connection failed"}`);
        fetchSocialStatus();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  const onInstagramConnect = () => {
    if (!appUser) return setToast("❌ app_user missing. Login again.");
    const url = buildInstagramAuthUrl(appUser);
    if (!url) return setToast("❌ Missing IG env vars (CLIENT_ID or REDIRECT_URI).");
    const pop = openCenteredPopup(url, "instagram_oauth");
    if (!pop) setToast("❌ Popup blocked. Allow popups and try again.");
  };

  const onFacebookConnect = () => {
    if (!appUser) return setToast("❌ app_user missing. Login again.");
    const url = buildFacebookAuthUrl(appUser);
    if (!url) return setToast("❌ Missing FB env vars (CLIENT_ID or REDIRECT_URI).");
    const pop = openCenteredPopup(url, "facebook_oauth");
    if (!pop) setToast("❌ Popup blocked. Allow popups and try again.");
  };

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
      {toast && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3 text-sm">
          {toast}
        </div>
      )}

      {/* Profile summary (only from local/profile prop, no backend call) */}
      <div className="mb-6 rounded-3xl border border-border bg-background p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Logged in as</div>
            <div className="mt-1 text-lg font-semibold">{profile?.username || "—"}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {profile?.email || ""}
              {profile?.business_type ? ` • ${profile.business_type}` : ""}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
            <Badge label={`Connected: ${connectedCount}/3`} />
            <button
              onClick={fetchSocialStatus}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition hover:bg-muted"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Next steps</p>
          <h2 className="mt-2 text-xl font-semibold">What you can do next</h2>

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
        {/* LinkedIn */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">LinkedIn</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Company page or profile posting
              </p>
            </div>
          </div>

          <LinkedInConnectClient
            appUser={appUser}
            connected={social.linkedin.connected}
            connectionDetails={{ detail: social.linkedin.detail }}
            onConnected={() => fetchSocialStatus()}
            fullWidth
            connectLabel="Connect"
            disconnectLabel="Disconnect"
          />
        </div>

        {/* Instagram */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">Instagram</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Auto post images + captions
              </p>
            </div>

            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                isInstagramConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isInstagramConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          <button
            onClick={onInstagramConnect}
            className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            {isInstagramConnected ? "Reconnect" : "Connect"}
          </button>

          {!!social.instagram.detail?.username && (
            <div className="mt-2 text-xs text-muted-foreground">
              @{(social.instagram.detail as any).username}
            </div>
          )}
        </div>

        {/* Facebook */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">Facebook</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Pages + scheduled posting
              </p>
            </div>

            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                isFacebookConnected
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isFacebookConnected ? "Connected" : "Not connected"}
            </span>
          </div>

          <button
            onClick={onFacebookConnect}
            className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            {isFacebookConnected ? "Reconnect" : "Connect"}
          </button>

          {!!social.facebook.detail?.page_name && (
            <div className="mt-2 text-xs text-muted-foreground">
              Page: {(social.facebook.detail as any).page_name}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        Logged in securely. Token stored locally.
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
      {label}
    </span>
  );
}