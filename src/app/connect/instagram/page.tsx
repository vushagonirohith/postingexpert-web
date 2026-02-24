"use client";

import React, { useEffect, useState } from "react";

type CallbackMessage = {
  type: "instagram_callback";
  success: boolean;
  ig_username?: string;
  ig_business_id?: string;
  page_id?: string;
  message?: string;
  error?: string;
};

type Props = {
  appUser: string;
  connected: boolean;
  onConnected: () => void;
  connectionDetails?: any;
};

// ─── Constants — must exactly match Meta App settings ─────────────────────────
const INSTAGRAM_CLIENT_ID =
  process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || "1095157869184608";

// ✅ Must match Valid OAuth Redirect URI in Meta developer console
const INSTAGRAM_REDIRECT_URI =
  "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com/prod/social/instagram/callback";

// ✅ Only scopes that are submitted in your App Review — nothing extra
const INSTAGRAM_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

// ─── Component ────────────────────────────────────────────────────────────────
export default function InstagramConnect({
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

  // Sync backend truth
  useEffect(() => {
    if (connected) setUiConnected(false);
    if (!isConnected) {
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [connected, isConnected]);

  // ── Listen for postMessage from Lambda popup ──────────────────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const msg = data as CallbackMessage;
      if (!msg || msg.type !== "instagram_callback") return;

      setIsConnecting(false);

      if (msg.success) {
        setErrorMsg(null);
        setSuccessMsg(
          msg.ig_username
            ? `Connected @${msg.ig_username} successfully!`
            : msg.message || "Instagram connected successfully!"
        );
        setUiConnected(true);
        onConnected(); // refresh parent
      } else {
        setSuccessMsg(null);
        setErrorMsg(msg.error || "Instagram connection failed. Please try again.");
        setUiConnected(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onConnected]);

  // ── Connect handler ──────────────────────────────────────────────────────
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

    // ✅ v21.0, correct redirect URI, correct scopes — no debug lines
    const url =
      "https://www.facebook.com/v21.0/dialog/oauth" +
      `?client_id=${encodeURIComponent(INSTAGRAM_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(appUser)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(INSTAGRAM_SCOPES)}` +
      `&display=popup`;

    // Centered popup
    const w = 600, h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      url,
      "instagram-auth",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,status=1`
    );

    if (!popup) {
      alert("Popup blocked. Please allow popups for this site and try again.");
      setIsConnecting(false);
      return;
    }

    // Detect popup closed without completing
    const checkClosed = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(checkClosed);
        setIsConnecting(false);
        setTimeout(() => onConnected(), 700);
      }
    }, 800);
  };

  // ── Disconnect handler ───────────────────────────────────────────────────
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

      const res = await fetch(`${API_BASE}/social/instagram/disconnect`, {
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
        setErrorMsg(result.error || "Failed to disconnect Instagram.");
      }
    } catch (err) {
      console.error("Instagram disconnect error:", err);
      setErrorMsg("Error disconnecting. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
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

          {isConnected && detail?.ig_username && (
            <span className="text-xs text-gray-500">
              • @{detail.ig_username}
            </span>
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

      {/* Connected account details */}
      {isConnected && detail && (
        <div className="mt-3 rounded-xl border border-pink-100 bg-pink-50 p-3 text-xs text-pink-800">
          {detail.ig_username && (
            <div>
              <strong>Account:</strong> @{detail.ig_username}
            </div>
          )}
          {detail.page_name && (
            <div>
              <strong>Page:</strong> {detail.page_name}
            </div>
          )}
          {detail.ig_business_id && (
            <div>
              <strong>Business ID:</strong> {detail.ig_business_id}
            </div>
          )}
          {detail.connected_at && (
            <div className="mt-1 opacity-70">
              Connected:{" "}
              {new Date(
                typeof detail.connected_at === "number"
                  ? detail.connected_at * 1000
                  : detail.connected_at
              ).toLocaleDateString()}
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
          background: isConnected
            ? "#dc3545"
            : "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
          cursor: isConnecting ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {isConnecting
          ? isConnected
            ? "Disconnecting..."
            : "Connecting..."
          : isConnected
          ? "Disconnect Instagram"
          : "Connect Instagram"}
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