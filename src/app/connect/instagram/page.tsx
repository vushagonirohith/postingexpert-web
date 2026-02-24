"use client";

import React, { useEffect, useMemo, useState } from "react";

type CallbackMessage = {
  type: "instagram_callback";
  success: boolean;
  instagram_username?: string;
  instagram_user_id?: string;
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

const FACEBOOK_CLIENT_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "1095157869184608";

// ✅ Your Lambda callback endpoint
const INSTAGRAM_REDIRECT_URI =
  "https://vpgqg4a4tk.execute-api.ap-south-1.amazonaws.com/prod/social/instagram/callback";

export default function InstagramConnectPage({
  appUser,
  connected,
  onConnected,
  connectionDetails,
}: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [uiConnected, setUiConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const detail = connectionDetails?.detail || null;
  const isConnected = connected || uiConnected;

  const modeLabel = useMemo(() => {
    if (!isConnected) return null;
    if (detail?.username) return `@${detail.username}`;
    return "Instagram Business";
  }, [isConnected, detail?.username]);

  useEffect(() => {
    if (connected) setUiConnected(false);
    if (!isConnected) setLastMessage(null);
  }, [connected, isConnected]);

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
        setLastError(null);
        setLastMessage(msg.message || "Instagram connected successfully!");
        setUiConnected(true);
        onConnected();
      } else {
        setLastMessage(null);
        setLastError(msg.error || "Instagram connect failed");
        setUiConnected(false);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
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

    const scopes = [
      "public_profile",
      "pages_show_list",
      "instagram_basic",
      "instagram_content_publish",
    ].join(",");

    const url =
      "https://www.facebook.com/v21.0/dialog/oauth" +
      `?client_id=${encodeURIComponent(FACEBOOK_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(appUser)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&display=popup` +
      `&auth_type=rerequest`;

    const popup = window.open(
      url,
      "instagram-auth",
      "width=600,height=720,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      alert("Popup blocked. Please allow popups and try again.");
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
    alert("Disconnect API not wired here yet (we will add next step).");
  };

  return (
    <div className="p-6">
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

          {isConnected && modeLabel ? (
            <span className="text-xs text-gray-500">• {modeLabel}</span>
          ) : null}
        </div>

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

      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className="mt-4 w-full rounded-full px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-70"
        style={{
          backgroundColor: isConnected ? "#dc3545" : "#E1306C",
          cursor: isConnecting ? "not-allowed" : "pointer",
          border: "none",
        }}
      >
        {isConnecting
          ? isConnected
            ? "Disconnecting..."
            : "Connecting..."
          : isConnected
          ? "Disconnect"
          : "Connect Instagram"}
      </button>

      {lastMessage ? (
        <div className="mt-2 rounded-2xl border p-2 text-xs">✅ {lastMessage}</div>
      ) : null}

      {lastError ? (
        <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          ❌ {lastError}
        </div>
      ) : null}
    </div>
  );
}
