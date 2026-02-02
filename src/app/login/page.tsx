// src/app/login/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { saveAuth } from "@/lib/auth";
import { apiFetch, API_BASE } from "@/lib/api";
// 🆕 HUBSPOT CRM IMPORT
import HubSpotCRMService from "@/lib/hubspotCRM";

export default function LoginPage() {
  const router = useRouter();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [msg, setMsg] = useState<string>("");

  // ✅ Warmup to start EC2 early (requires Lambda route /warmup)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.log("🔥 Warmup via API_BASE:", API_BASE);
        setLoading(true);
        setLoadingMessage("Starting server...");

        await apiFetch("/health", { method: "GET" });

        if (!cancelled) {
          setLoading(false);
          setLoadingMessage("");
        }
      } catch (e) {
        console.warn("⚠️ Warmup failed (safe):", e);
        if (!cancelled) {
          setLoading(false);
          setLoadingMessage("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    setLoadingMessage("Connecting to server...");

    try {
      const data: any = await apiFetch("/user/login", {
        method: "POST",
        body: {
          username: usernameOrEmail,
          password,
          rememberMe,
        },
      });

      const token =
        data?.token || data?.access_token || data?.jwt || data?.data?.token;

      const expiresIn =
        data?.expiresIn || data?.expires_in || data?.data?.expires_in || 86400;

      const user = data?.user || {};
      const username = user?.username || data?.username || usernameOrEmail;
      const userId = user?.user_id || data?.user_id || data?.user?.id;

      // ✅ Pull email from response; if not present, infer only if user typed an email
      const rawEmailFromApi = user?.email || data?.email || "";
      const typedLooksLikeEmail =
        typeof usernameOrEmail === "string" && usernameOrEmail.includes("@");
      const inferredEmail = typedLooksLikeEmail ? usernameOrEmail : "";

      const userEmail = (rawEmailFromApi || inferredEmail).trim();

      if (!token) throw new Error("Authentication failed - no token received");

      // ✅ Store auth
      localStorage.setItem("token", token);
      localStorage.setItem("username", username);
      localStorage.setItem(
        "tokenExpiry",
        String(Date.now() + Number(expiresIn) * 1000)
      );

      // ✅ IMPORTANT FIX:
      // Analytics expects EMAIL. Store it in a consistent key.
      if (userEmail) {
        localStorage.setItem("email", userEmail);      // ✅ primary key
        localStorage.setItem("userEmail", userEmail);  // ✅ keep for compatibility
        localStorage.setItem("user_email", userEmail); // ✅ optional compatibility
      } else {
        // Avoid stale values
        localStorage.removeItem("email");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("user_email");
      }

      saveAuth({
        token,
        username,
        user_id: userId,
        expires_in: expiresIn,
      });

      // ✅ Remember me
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", usernameOrEmail);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberMe");
      }

      // 🆕 RECORD USER IN HUBSPOT CRM (non-blocking)
      try {
        // Use the real email; if missing, skip CRM instead of fake @example.com
        if (userEmail) {
          await HubSpotCRMService.createContact(
            userEmail,
            username,
            userId || username
          );
          console.log("✅ User recorded in HubSpot CRM");
        } else {
          console.warn("⚠️ No email available; skipped HubSpot contact create.");
        }
      } catch (crmError) {
        console.warn("⚠️ HubSpot CRM error (non-fatal):", crmError);
      }

      setLoadingMessage("Success! Redirecting...");
      setTimeout(() => router.push("/connect"), 500);
    } catch (err: any) {
      console.error("❌ Login error:", err);

      const m = String(err?.message || "");
      if (m.includes("504") || m.toLowerCase().includes("timeout")) {
        setMsg("Server is starting up. Please wait 30 seconds and try again.");
      } else if (m.includes("Failed to fetch")) {
        setMsg("Cannot connect to server. Please check your internet connection.");
      } else {
        setMsg(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  // ✅ Auto-fill remembered username + auto redirect if already logged in
  useEffect(() => {
    try {
      const rememberedUsername = localStorage.getItem("rememberedUsername");
      const rememberedRememberMe = localStorage.getItem("rememberMe") === "true";
      if (rememberedUsername && rememberedRememberMe) {
        setUsernameOrEmail(rememberedUsername);
        setRememberMe(true);
      }

      const token = localStorage.getItem("token");
      const tokenExpiry = localStorage.getItem("tokenExpiry");
      if (token && tokenExpiry && Number(tokenExpiry) > Date.now()) {
        router.replace("/connect");
      }
    } catch {
      // ignore
    }
  }, [router]);

  return (
    <>
      <SiteNavbar />
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            {/* Left */}
            <div className="max-w-xl">
              <p className="text-sm text-muted-foreground">Login</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Enter your dashboard.
              </h1>
              <p className="mt-5 text-muted-foreground">
                Quiet visibility. Calm automation. No noisy controls.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium text-foreground">
                  What you'll see inside
                </p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Auto Mode status + connected platforms
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Weekly posting output + engagement trend
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    Analytics that improves over time
                  </li>
                </ul>
              </div>

              {loading && loadingMessage && (
                <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <p className="text-sm text-foreground">{loadingMessage}</p>
                  </div>
                  {(loadingMessage.includes("Starting") ||
                    loadingMessage.includes("Connecting")) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      First login may take 30–60 seconds while the server starts
                    </p>
                  )}
                </div>
              )}

              {/* CTA to register */}
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium text-foreground">New here?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your account to start automating your posting.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Create your account
                </button>
              </div>
            </div>

            {/* Right (form) */}
            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <p className="text-sm font-medium text-foreground">Sign in</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your username or email.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Username
                  </label>
                  <input
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="username"
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4"
                  />
                  Remember me
                </label>

                {msg ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {msg}
                  </div>
                ) : null}

                <button
                  disabled={loading}
                  className={[
                    "mt-2 w-full rounded-full px-6 py-3 text-sm font-medium shadow-sm transition",
                    loading
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:opacity-90",
                  ].join(" ")}
                >
                  {loading ? loadingMessage || "Signing in..." : "Continue"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  New user?{" "}
                  <a href="/register" className="underline underline-offset-4">
                    Create an account
                  </a>
                </p>

                <p className="text-center text-xs text-muted-foreground">
                  No spam. No noise. Just automation.
                </p>
              </div>
            </form>
          </div>
        </div>

        <SiteFooter />
      </main>
    </>
  );
}
