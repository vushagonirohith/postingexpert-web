"use client";

import React, { useEffect, useMemo, useState } from "react";

type ConnectionDetail = {
  posting_method?: string;
  organization_count?: number;
  has_org_access?: boolean;
  person_urn?: string;
  org_urn?: string;
  connected_at?: string;
};

type ConnectionDetailsProp = {
  detail?: ConnectionDetail | null;
};

type LinkedInCallbackMessage = {
  type: "linkedin_callback";
  success: boolean;
  posting_method?: string;
  organization_count?: number;
  has_org_access?: boolean;
  person_urn?: string;
  org_urn?: string;
  message?: string;
  error?: string;
};

type Props = {
  appUser: string;
  onConnected: () => void; // refreshSocial in parent
  connected: boolean; // from backend status
  connectionDetails?: ConnectionDetailsProp | null;

  fullWidth?: boolean;
  connectLabel?: string;
  disconnectLabel?: string;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://13.233.45.167:5000"
).replace(/\/$/, "");

const LINKEDIN_CLIENT_ID =
  process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "86geycovoa141y";

const LINKEDIN_REDIRECT_URI =
  process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI ||
  `${API_BASE}/social/linkedin/callback`;

export default function LinkedInConnectClient({
  appUser,
  onConnected,
  connected,
  connectionDetails = null,
  fullWidth = true,
  connectLabel = "Connect",
  disconnectLabel = "Disconnect",
}: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // ✅ UI-only: temporary connected state after success callback
  const [uiConnected, setUiConnected] = useState(false);

  const detail = connectionDetails?.detail || null;

  // ✅ effective connected = backend OR uiConnected
  const isConnected = connected || uiConnected;

  const modeLabel = useMemo(() => {
    if (!isConnected) return null;
    const m = (detail?.posting_method || "").toLowerCase();
    if (m.includes("org") || detail?.org_urn) return "Organization / Page";
    return detail?.posting_method || "Personal Profile";
  }, [isConnected, detail?.posting_method, detail?.org_urn]);

  // If backend finally confirms connected, keep UI connected
  useEffect(() => {
    if (connected) setUiConnected(false); // backend is truth now
    if (!isConnected) setLastMessage(null);
  }, [connected, isConnected]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data: any = event.data;

      // accept stringified json also
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const msg = data as LinkedInCallbackMessage;
      if (!msg || msg.type !== "linkedin_callback") return;

      setIsConnecting(false);

      if (msg.success) {
        setLastError(null);
        setLastMessage(msg.message || "LinkedIn connected successfully!");

        // ✅ UI-only: show as connected immediately
        setUiConnected(true);

        onConnected(); // refreshSocial() in parent
      } else {
        setLastMessage(null);
        setLastError(msg.error || "LinkedIn connect failed");
        setUiConnected(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnected]);

  const handleConnect = () => {
    if (!appUser) {
      alert("User not found. Please login again.");
      window.location.href = "/login";
      return;
    }

    setIsConnecting(true);
    setLastMessage(null);
    setLastError(null);
    setUiConnected(false);

    const redirectUri = encodeURIComponent(LINKEDIN_REDIRECT_URI);

    const scopes = [
      "r_basicprofile",
      "w_member_social",
      "r_organization_social",
      "w_organization_social",
      "rw_organization_admin",
      "r_organization_followers",
      "r_organization_social_feed",
      "w_organization_social_feed",
      "r_member_profileAnalytics",
      "r_member_postAnalytics",
    ].join(" ");

    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(
      LINKEDIN_CLIENT_ID
    )}&redirect_uri=${redirectUri}&state=${encodeURIComponent(
      appUser
    )}&scope=${encodeURIComponent(scopes)}`;

    const popup = window.open(
      url,
      "linkedin-auth",
      "width=600,height=720,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      alert("Popup blocked. Please allow popups for this site and try again.");
      setIsConnecting(false);
      return;
    }

    const checkClosed = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(checkClosed);
        setIsConnecting(false);
        setTimeout(() => onConnected(), 700);
      }
    }, 800);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect LinkedIn?")) return;

    try {
      setIsConnecting(true);
      setLastMessage(null);
      setLastError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again to disconnect LinkedIn.");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`${API_BASE}/social/linkedin/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_user: appUser,
          platform: "linkedin",
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok && (result as any)?.success) {
        setUiConnected(false); // ✅ UI immediate
        setLastMessage("LinkedIn disconnected successfully!");
        setLastError(null);
        onConnected();
      } else {
        const err =
          (result as any)?.error ||
          (result as any)?.message ||
          "Failed to disconnect.";
        setLastError(err);
      }
    } catch (e: any) {
      setLastError(e?.message || "Unknown error");
    } finally {
      setIsConnecting(false);
    }
  };

  const btnLabel = isConnecting
    ? isConnected
      ? "Disconnecting..."
      : "Connecting..."
    : isConnected
    ? disconnectLabel
    : connectLabel;

  return (
    <div className="mt-5">
      {/* ✅ Top status row (only one badge) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isConnected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isConnected ? "Connected" : "Not connected"}
          </span>

          {isConnected && modeLabel ? (
            <span className="text-xs text-muted-foreground">• {modeLabel}</span>
          ) : null}
        </div>

        {/* ✅ Disconnect on top when connected */}
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      {/* ✅ Detail box only when connected */}
      {isConnected && detail ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-3 text-xs">
          <div className="grid grid-cols-1 gap-2">
            {detail.person_urn ? <Row label="Person URN" value={detail.person_urn} /> : null}
            {detail.org_urn ? <Row label="Org URN" value={detail.org_urn} /> : null}
          </div>
        </div>
      ) : null}

      {/* Main button */}
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={
          fullWidth
            ? "mt-4 w-full rounded-full px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
            : "mt-4 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
        }
        style={{
          backgroundColor: isConnected ? "#dc3545" : "#8b7bff",
          cursor: isConnecting ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {btnLabel}
      </button>

      {/* message/error */}
      {lastMessage ? (
        <div className="mt-2 rounded-2xl border border-border bg-background p-2 text-xs">
          ✅ {lastMessage}
        </div>
      ) : null}

      {lastError ? (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          ❌ {lastError}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[70%] select-all break-all text-right font-medium">
        {value}
      </span>
    </div>
  );
}