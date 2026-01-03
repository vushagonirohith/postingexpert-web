// src/app/connect/instagram/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CallbackStatus = "processing" | "success" | "error";

export default function InstagramCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Connecting to Instagram...");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state"); // app_user
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // If user directly opens /connect/instagram in browser, code/state will be missing
      if (!code || !state) {
        if (error) {
          const errMsg = errorDescription || error;
          setStatus("error");
          setMessage(errMsg);
        } else {
          setStatus("error");
          setMessage("Missing code/state from Instagram");
        }

        // notify opener if any
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "instagram_callback",
              success: false,
              error: !code || !state ? "Missing code/state" : "Unknown error",
            },
            "*"
          );
          setTimeout(() => window.close(), 1500);
        }
        return;
      }

      try {
        setMessage("Exchanging authorization code...");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://13.233.45.167:5000";

        const resp = await fetch(`${apiUrl}/social/instagram/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const result = await resp.json();

        if (result?.success) {
          setStatus("success");
          setMessage(
            `Connected Instagram: @${result.instagram_username || "your account"}`
          );

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "instagram_callback",
                success: true,
                instagram_username: result.instagram_username,
                instagram_user_id: result.instagram_user_id,
                app_user: state,
              },
              "*"
            );
            setTimeout(() => window.close(), 1200);
          }
        } else {
          setStatus("error");
          setMessage(result?.error || "Connection failed");

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "instagram_callback",
                success: false,
                error: result?.error || "Connection failed",
              },
              "*"
            );
            setTimeout(() => window.close(), 1500);
          }
        }
      } catch (e: any) {
        setStatus("error");
        setMessage("Network error. Please try again.");

        if (window.opener) {
          window.opener.postMessage(
            { type: "instagram_callback", success: false, error: "Network error" },
            "*"
          );
          setTimeout(() => window.close(), 1500);
        }
      }
    };

    run();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black/90 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <h2
          className={`mb-4 text-2xl font-semibold ${
            status === "success"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : "text-gray-800"
          }`}
        >
          {status === "processing" && "⏳ Connecting..."}
          {status === "success" && "✅ Connected!"}
          {status === "error" && "❌ Failed"}
        </h2>

        {status === "processing" && (
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
        )}

        <p className={`${status === "error" ? "text-red-600" : "text-gray-600"}`}>
          {message}
        </p>

        <p className="mt-6 text-sm italic text-gray-400">
          This window will close automatically...
        </p>
      </div>
    </div>
  );
}