// src/app/connect/ConnectClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LinkedInConnectClient from "./linkedin/LinkedInConnectClient";
import { apiFetch } from "@/lib/api";
import { getToken, clearAuth } from "@/lib/auth";

type SocialDetail = Record<string, any> | null;

type SocialStatus = {
  instagram: boolean;
  linkedin: boolean;
  facebook: boolean;
  instagram_detail?: SocialDetail;
  linkedin_detail?: SocialDetail;
  facebook_detail?: SocialDetail;
  [k: string]: any;
};

type ProfileLite = {
  username?: string;
  email?: string;
  business_type?: string;
  connected_accounts?: number;
  posts_created?: number;
  scheduled_time?: string;
};

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

  const url =
    "https://www.facebook.com/v21.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(appUser)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(","))}`;

  return url;
}

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

  const url =
    "https://www.facebook.com/v21.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(appUser)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(","))}`;

  return url;
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

export default function ConnectClient({
  profile,
  social,
}: {
  profile: ProfileLite | null;
  social: SocialStatus;
}) {
  const router = useRouter();

  const [localSocial, setLocalSocial] = useState<SocialStatus>(social);
  const [toast, setToast] = useState<string | null>(null);

  // profile shown in UI
  const [userProfile, setUserProfile] = useState<ProfileLite | null>(profile);

  // instagram/facebook optimistic UI state
  const [igUiConnected, setIgUiConnected] = useState(false);
  const [fbUiConnected, setFbUiConnected] = useState(false);

  useEffect(() => {
    setLocalSocial(social);
  }, [social]);

  const appUser = useMemo(() => getAppUser(userProfile || profile), [
    userProfile?.username,
    profile?.username,
  ]);

  const connectedCount = useMemo(() => {
    const ig = localSocial.instagram || igUiConnected;
    const li = localSocial.linkedin;
    const fb = localSocial.facebook || fbUiConnected;
    return [ig, li, fb].filter(Boolean).length;
  }, [localSocial, igUiConnected, fbUiConnected]);

  const fetchUserProfile = async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    try {
      const res = await apiFetch("/user/profile", { method: "GET", token });
      const p = res?.profile || res || {};
      setUserProfile({
        username: p.username,
        email: p.email,
        business_type: p.business_type,
        connected_accounts: p.connected_accounts,
        posts_created: p.posts_created,
        scheduled_time: p.scheduled_time,
      });
    } catch (e: any) {
      const msg = e?.message || "Failed to load profile.";
      if (isAuthErrorMessage(msg)) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setToast(`❌ ${msg}`);
    }
  };

  const refreshSocial = async () => {
    const token = getToken();
    if (!token) {
      setToast("❌ Missing token. Please login again.");
      clearAuth();
      router.replace("/login");
      return;
    }

    try {
      const res = await apiFetch("/social/status", {
        method: "GET",
        token,
      });

      const s = res?.status || res?.connected || res || {};

      const pickBool = (v: any) => {
        if (typeof v === "boolean") return v;
        if (v && typeof v === "object") {
          if (typeof v.connected === "boolean") return v.connected;
          if (typeof v.is_connected === "boolean") return v.is_connected;
          if (typeof v.ok === "boolean") return v.ok;
        }
        return false;
      };

      const next: SocialStatus = {
        instagram: pickBool(s.instagram),
        linkedin: pickBool(s.linkedin),
        facebook: pickBool(s.facebook),
        instagram_detail: s.instagram?.detail || s.instagram_detail || null,
        linkedin_detail: s.linkedin?.detail || s.linkedin_detail || null,
        facebook_detail: s.facebook?.detail || s.facebook_detail || null,
      };

      setLocalSocial(next);

      // if backend says connected, stop optimistic flags
      if (next.instagram) setIgUiConnected(false);
      if (next.facebook) setFbUiConnected(false);
    } catch (e: any) {
      const msg = e?.message || "Failed to refresh social status.";
      if (isAuthErrorMessage(msg)) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setToast(`❌ ${msg}`);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // popup callback listener (IG + FB + LI)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;

      if (msg.type === "instagram_callback") {
        if (msg.success) {
          setToast("✅ Instagram connected!");
          setIgUiConnected(true); // ✅ optimistic connected immediately
        } else {
          setToast(`❌ Instagram: ${msg.error || "Connection failed"}`);
          setIgUiConnected(false);
        }
        refreshSocial();
        fetchUserProfile();
      }

      if (msg.type === "facebook_callback") {
        if (msg.success) {
          setToast("✅ Facebook connected!");
          setFbUiConnected(true); // ✅ optimistic
        } else {
          setToast(`❌ Facebook: ${msg.error || "Connection failed"}`);
          setFbUiConnected(false);
        }
        refreshSocial();
        fetchUserProfile();
      }

      if (msg.type === "linkedin_callback") {
        setToast(
          msg.success
            ? "✅ LinkedIn connected!"
            : `❌ LinkedIn: ${msg.error || "Connection failed"}`
        );
        refreshSocial();
        fetchUserProfile();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Instagram connect/disconnect
  const onInstagramConnect = () => {
    if (!appUser) {
      setToast("❌ appUser missing (username). Login again.");
      return;
    }
    const authUrl = buildInstagramAuthUrl(appUser);
    if (!authUrl) {
      setToast("❌ Missing NEXT_PUBLIC_INSTAGRAM_CLIENT_ID or REDIRECT_URI");
      return;
    }
    const pop = openCenteredPopup(authUrl, "instagram_oauth");
    if (!pop) setToast("❌ Popup blocked. Allow popups and try again.");
  };

  const onInstagramDisconnect = async () => {
    if (!window.confirm("Disconnect Instagram?")) return;

    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    try {
      const res = await apiFetch("/social/instagram/disconnect", {
        method: "POST",
        token,
        body: { app_user: appUser },
      });

      if (res?.success) {
        setToast("✅ Instagram disconnected!");
        setIgUiConnected(false);
        refreshSocial();
      } else {
        setToast(`❌ ${res?.error || res?.message || "Disconnect failed"}`);
      }
    } catch (e: any) {
      setToast(`❌ ${e?.message || "Disconnect failed"}`);
    }
  };

  // Facebook connect/disconnect
  const onFacebookConnect = () => {
    if (!appUser) {
      setToast("❌ appUser missing (username). Login again.");
      return;
    }
    const authUrl = buildFacebookAuthUrl(appUser);
    if (!authUrl) {
      setToast("❌ Missing NEXT_PUBLIC_FACEBOOK_CLIENT_ID or REDIRECT_URI");
      return;
    }
    const pop = openCenteredPopup(authUrl, "facebook_oauth");
    if (!pop) setToast("❌ Popup blocked. Allow popups and try again.");
  };

  const onFacebookDisconnect = async () => {
    if (!window.confirm("Disconnect Facebook?")) return;

    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    try {
      const res = await apiFetch("/social/facebook/disconnect", {
        method: "POST",
        token,
        body: { app_user: appUser },
      });

      if (res?.success) {
        setToast("✅ Facebook disconnected!");
        setFbUiConnected(false);
        refreshSocial();
      } else {
        setToast(`❌ ${res?.error || res?.message || "Disconnect failed"}`);
      }
    } catch (e: any) {
      setToast(`❌ ${e?.message || "Disconnect failed"}`);
    }
  };

  // Effective connected flags (includes optimistic for IG/FB)
  const isInstagramConnected = !!localSocial.instagram || igUiConnected;
  const isFacebookConnected = !!localSocial.facebook || fbUiConnected;

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
      {toast && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3 text-sm">
          {toast}
        </div>
      )}

      {/* Profile */}
      <div className="mb-6 rounded-3xl border border-border bg-background p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Logged in as</div>
            <div className="mt-1 text-lg font-semibold">
              {userProfile?.username || "—"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {userProfile?.email || ""}
              {userProfile?.business_type ? ` • ${userProfile.business_type}` : ""}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
            <Badge label={`Connected: ${connectedCount}/3`} />
            {typeof userProfile?.posts_created === "number" ? (
              <Badge label={`Posts: ${userProfile.posts_created}`} />
            ) : null}
            {userProfile?.scheduled_time ? (
              <Badge label={`Schedule: ${userProfile.scheduled_time}`} />
            ) : null}

            <button
              onClick={() => {
                refreshSocial();
                fetchUserProfile();
              }}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition hover:bg-muted"
            >
              Refresh
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
            {/* ✅ REMOVED parent status badge to avoid duplicate */}
          </div>

          <LinkedInConnectClient
            appUser={appUser}
            connected={!!localSocial.linkedin}
            connectionDetails={{
              detail: (localSocial.linkedin_detail as any) || null,
            }}
            onConnected={() => {
              refreshSocial();
              fetchUserProfile();
            }}
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

            {/* ✅ SINGLE status badge here (uses optimistic flag too) */}
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

          {isInstagramConnected ? (
            <button
              onClick={onInstagramDisconnect}
              className="mt-5 w-full rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onInstagramConnect}
              className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Connect
            </button>
          )}

          {!!localSocial.instagram_detail?.username && (
            <div className="mt-2 text-xs text-muted-foreground">
              @{localSocial.instagram_detail.username}
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

            {/* ✅ SINGLE status badge here (uses optimistic flag too) */}
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

          {isFacebookConnected ? (
            <button
              onClick={onFacebookDisconnect}
              className="mt-5 w-full rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={onFacebookConnect}
              className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Connect
            </button>
          )}

          {!!localSocial.facebook_detail?.page_name && (
            <div className="mt-2 text-xs text-muted-foreground">
              Page: {localSocial.facebook_detail.page_name}
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