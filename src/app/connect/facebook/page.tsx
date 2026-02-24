"use client";

import React, { useEffect, useMemo, useState } from "react";

type CallbackMessage = {
  type: "facebook_callback";
  success: boolean;
  page_name?: string;
  page_id?: string;
  message?: string;
  error?: string;
  app_user?: string;
};

type Props = {
  appUser: string;
  connected: boolean;
  onConnected: () => void;
  connectionDetails?: any;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FACEBOOK_CLIENT_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "1095157869184608";

// Must exactly match one of the Valid OAuth Redirect URIs in your Meta app settings
const FACEBOOK_REDIRECT_URI =
  "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com/prod/social/facebook/callback";

// Scopes that match exactly what you submitted in App Review
const FACEBOOK_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_manage_engagement",
].join(",");

// ─── Component ────────────────────────────────────────────────────────────────
export default function FacebookConnect({
  appUser,
  connected,
  onConnected,
  connectionDetails,
}: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [uiConnected, setUiConnected] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const detail = connectionDetails?.detail || null;
  const isConnected = connected || uiConnected;

  // Page label shown when connected
  const modeLabel = useMemo(() => {
    if (!isConnected) return null;
    if (detail?.page_name) return `Page: ${detail.page_name}`;
    if (detail?.facebook_page_name) return `Page: ${detail.facebook_page_name}`;
    return "Facebook Page";
  }, [isConnected, detail]);

  // Sync backend truth
  useEffect(() => {
    if (connected) setUiConnected(false);
    if (!isConnected) {
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [connected, isConnected]);

  // Listen for postMessage from the OAuth popup
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from facebook.com or our own origin
      let data: any = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const msg = data as CallbackMessage;
      if (!msg || msg.type !== "facebook_callback") return;

      setIsConnecting(false);

      if (msg.success) {
        setErrorMsg(null);
        setSuccessMsg(
          msg.page_name
            ? `Connected to "${msg.page_name}" successfully!`
            : msg.message || "Facebook connected successfully!"
        );
        setUiConnected(true);
        onConnected(); // refresh parent status
      } else {
        setSuccessMsg(null);
        setErrorMsg(msg.error || "Facebook connection failed. Please try again.");
        setUiConnected(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onConnected]);

  // ── Connect handler ─────────────────────────────────────────────────────────
  const handleConnect = () => {
    if (!appUser) {
      alert("User not found. Please login again.");
      window.location.href = "/login";
      return;
    }

    setIsConnecting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    setUiConnected(false);

    // Build the OAuth URL
    const url =
      "https://www.facebook.com/v21.0/dialog/oauth" +
      `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(appUser)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(FACEBOOK_SCOPES)}` +
      `&display=popup`;

    // Open centered popup
    const w = 600, h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    console.log("FB OAUTH URL:", url);
    const popup = window.open(
      url,
      "facebook-auth",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,status=1`
    );

    if (!popup) {
      alert("Popup blocked. Please allow popups for this site and try again.");
      setIsConnecting(false);
      return;
    }

    // Detect popup closed without completing OAuth
    const checkClosed = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(checkClosed);
        setIsConnecting(false);
        // Refresh status in case they connected but message was missed
        setTimeout(() => onConnected(), 700);
      }
    }, 800);
  };

  // ── Disconnect handler ──────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        alert("Please login again to disconnect.");
        window.location.href = "/login";
        return;
      }

      const API_BASE =
        process.env.NEXT_PUBLIC_API_BASE ||
        "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com/prod";

      const res = await fetch(`${API_BASE}/social/facebook/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ app_user: appUser }),
      });

      const result = await res.json();

      if (result.success) {
        setUiConnected(false);
        setSuccessMsg(null);
        setErrorMsg(null);
        onConnected();
      } else {
        setErrorMsg(result.error || "Failed to disconnect Facebook.");
      }
    } catch (err) {
      console.error("Facebook disconnect error:", err);
      setErrorMsg("Error disconnecting. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Status badge + disconnect link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              isConnected
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {isConnected ? "Connected" : "Not connected"}
          </span>

          {isConnected && modeLabel && (
            <span className="text-xs text-gray-500">• {modeLabel}</span>
          )}
        </div>

        {isConnected && (
          <button
            onClick={handleDisconnect}
            disabled={isConnecting}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Connected page details */}
      {isConnected && detail && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          {detail.facebook_page_name && (
            <div>
              <strong>Page:</strong> {detail.facebook_page_name}
            </div>
          )}
          {detail.facebook_page_id && (
            <div>
              <strong>Page ID:</strong> {detail.facebook_page_id}
            </div>
          )}
          {detail.facebook_connected_at && (
            <div className="mt-1 opacity-70">
              Connected:{" "}
              {new Date(detail.facebook_connected_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Main action button */}
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className="mt-4 w-full rounded-full px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
        style={{
          backgroundColor: isConnected ? "#dc3545" : "#1877F2",
          cursor: isConnecting ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {isConnecting
          ? isConnected
            ? "Disconnecting..."
            : "Connecting..."
          : isConnected
          ? "Disconnect Facebook"
          : "Connect Facebook"}
      </button>

      {/* Success message */}
      {successMsg && (
        <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-2 text-xs text-green-700">
          ✅ {successMsg}
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          ❌ {errorMsg}
        </div>
      )}
    </div>
  );
}