"use client";

import React, { useEffect, useMemo, useState } from "react";

type ConnectionDetail = {
  posting_method?: string;
  organization_count?: number;
  has_org_access?: boolean;
  person_urn?: string;
  org_urn?: string;
  preferred_urn?: string;
  all_org_urns?: string[];
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
  onConnected: () => void;
  connected: boolean;
  connectionDetails?: ConnectionDetailsProp | null;
  fullWidth?: boolean;
  connectLabel?: string;
  disconnectLabel?: string;
};

const API_BASE = (
  "https://aomkmgl9zj.execute-api.ap-south-1.amazonaws.com/prod"
);

const LINKEDIN_CLIENT_ID =
  process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "86geycovoa141y";

const LINKEDIN_REDIRECT_URI =
  "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com/prod/social/linkedin/callback";

const FRONTEND_ORIGIN =
  process.env.NEXT_PUBLIC_APP_ORIGIN ||
  (typeof window !== "undefined" ? window.location.origin : "");

const ALLOWED_CALLBACK_ORIGINS = new Set<string>([
  FRONTEND_ORIGIN,
  "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com",
  "https://aomkmgl9zj.execute-api.ap-south-1.amazonaws.com",
]);

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
  const [uiConnected, setUiConnected] = useState(false);

  const detail = connectionDetails?.detail || null;
  const isConnected = connected || uiConnected;

  // ✅ Display posting method and org count
  const postingInfo = useMemo(() => {
    if (!isConnected || !detail) return null;

    const hasOrg = detail.has_org_access;
    const orgCount = detail.organization_count || 0;
    const method = detail.posting_method || "Personal Profile";

    return {
      method,
      hasOrg,
      orgCount,
      displayText: hasOrg 
        ? `${method} (${orgCount} org${orgCount > 1 ? 's' : ''})` 
        : method,
    };
  }, [isConnected, detail]);

  useEffect(() => {
    if (connected) setUiConnected(false);
    if (!isConnected) setLastMessage(null);
  }, [connected, isConnected]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data: any = event.data;

      console.log("[LinkedInConnectClient] message event:", {
        origin: event.origin,
        data,
      });

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
        setUiConnected(true);
        onConnected();
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
    console.log("LINKEDIN_REDIRECT_URI =", LINKEDIN_REDIRECT_URI);
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

    // ✅ Updated scopes to include organization posting
    const scopes = [
      "w_member_social",
      "r_basicprofile",
      "r_1st_connections_size",
      "r_member_profileAnalytics",
      "r_member_postAnalytics",
      "rw_organization_admin",
      "r_organization_social",
      "w_organization_social",
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

      const res = await fetch(`${API_BASE}/user/disconnect_social`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: "linkedin",
        }),
      });

      if (res.ok) {
        setUiConnected(false);
        setLastMessage("LinkedIn disconnected successfully!");
        setLastError(null);
        onConnected();
      } else {
        const result = await res.json().catch(() => ({}));
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
    <div>
      {/* ✅ Show posting method and disconnect when connected */}
      {isConnected && postingInfo ? (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {postingInfo.displayText}
          </span>
          <button
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
      ) : null}

      {/* ✅ Show connection details when connected */}
      {isConnected && detail ? (
        <div className="mb-3 rounded-2xl border border-border bg-card p-3 text-xs">
          <div className="grid grid-cols-1 gap-2">
            {detail.person_urn ? (
              <Row label="Person URN" value={detail.person_urn} />
            ) : null}
            
            {detail.has_org_access && detail.all_org_urns && detail.all_org_urns.length > 0 ? (
              <>
                <Row 
                  label="Organizations" 
                  value={`${detail.all_org_urns.length} available`} 
                />
                {detail.preferred_urn ? (
                  <Row 
                    label="Posting to" 
                    value={detail.preferred_urn.includes("organization") ? "Company Page" : "Personal Profile"} 
                  />
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Main button */}
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={
          fullWidth
            ? `w-full rounded-full px-5 py-3 text-sm font-medium shadow-sm transition hover:opacity-90 disabled:opacity-70 ${
                isConnected
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }`
            : `rounded-md px-4 py-2 text-sm font-medium disabled:opacity-70 ${
                isConnected
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }`
        }
      >
        {btnLabel}
      </button>

      {/* Success/Error messages */}
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