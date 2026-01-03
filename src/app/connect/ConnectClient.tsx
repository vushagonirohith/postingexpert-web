"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://13.233.45.167:5000"
).replace(/\/$/, "");

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function getAppUser(profile?: ProfileLite | null) {
  return (
    profile?.username ||
    localStorage.getItem("username") ||
    localStorage.getItem("registeredUserId") ||
    ""
  );
}

/** Build Meta OAuth URL for Instagram Graph API (via Facebook OAuth dialog) */
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

  const [social, setSocial] = useState({
    instagram: { connected: false, detail: null as SocialDetail },
    linkedin: { connected: false, detail: null as SocialDetail },
    facebook: { connected: false, detail: null as SocialDetail },
  });

  const [toast, setToast] = useState<string | null>(null);

  const appUser = useMemo(() => getAppUser(profile), [profile?.username]);

  const connectedCount = useMemo(
    () => Object.values(social).filter((x) => x.connected).length,
    [social]
  );

  const fetchSocialStatus = async () => {
    const token = getToken();
    if (!token) {
      setToast("❌ Missing token. Please login again.");
      return;
    }
    if (!appUser) {
      setToast("❌ Missing appUser (username).");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/social/status?app_user=${encodeURIComponent(appUser)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const t = await res.text();
        setToast(`❌ Status failed: ${res.status} ${t?.slice(0, 120)}`);
        return;
      }

      const data = (await res.json()) as SocialStatusResponse;

      setSocial({
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
      });
    } catch (e: any) {
      // This is your "Failed to fetch" issue (CORS / wrong URL / network)
      setToast(`❌ Failed to fetch: ${e?.message || "Network/CORS error"}`);
    }
  };

  useEffect(() => {
    fetchSocialStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  // Listen for popup callback messages (Instagram page.tsx already postMessage)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;

      if (msg.type === "instagram_callback") {
        if (msg.success) {
          setToast("✅ Instagram connected!");
        } else {
          setToast(`❌ Instagram: ${msg.error || "Connection failed"}`);
        }
        fetchSocialStatus();
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  const instagramConnected = social.instagram.connected;

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

  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
      {toast && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-3 text-sm">
          {toast}
        </div>
      )}

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

          <p className="mt-4 text-xs text-muted-foreground">
            Connected: <span className="font-semibold">{connectedCount}/3</span>
          </p>
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
        {/* ✅ LinkedIn unchanged */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <p className="text-lg font-semibold">LinkedIn</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Company page or profile posting
          </p>

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

        {/* ✅ Instagram fixed: open OAuth popup (NOT router push) */}
        <div className="rounded-3xl border border-border bg-background p-6">
          <p className="text-lg font-semibold">Instagram</p>
          <p className="mt-2 text-sm text-muted-foreground">Auto post images + captions</p>

          <button
            onClick={onInstagramConnect}
            className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            {instagramConnected ? "Connected" : "Connect"}
          </button>

          {!!social.instagram.detail?.username && (
            <div className="mt-2 text-xs text-muted-foreground">
              @{social.instagram.detail.username}
            </div>
          )}
        </div>

        {/* Facebook (keep as your route for now) */}
        <PlatformCard
          title="Facebook"
          desc="Pages + scheduled posting"
          onClick={() => router.push("/connect/facebook")}
        />
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        Logged in securely. Token stored locally.
      </div>
    </div>
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