"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

import { apiFetch } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // ✅ same endpoint, keep UI same
      const data: any = await apiFetch("/user/login", {
        method: "POST",
        body: {
          username: usernameOrEmail,
          email: usernameOrEmail,
          password,
          rememberMe: true, // ✅ optional (matches your old working react)
        },
      });

      const token =
        data?.token || data?.access_token || data?.jwt || data?.data?.token;

      const expiresIn =
        data?.expiresIn || data?.expires_in || data?.data?.expires_in || 86400;

      if (!token) throw new Error("Token missing in login response");

      // ✅ IMPORTANT: store like old frontend so guards/pages can read it
      localStorage.setItem("token", token);
      localStorage.setItem("username", data?.user?.username || data?.username || usernameOrEmail);

      const expiryTime = Date.now() + Number(expiresIn) * 1000;
      localStorage.setItem("tokenExpiry", expiryTime.toString());

      // keep your existing auth helper too
      saveAuth({
        token,
        username: data?.user?.username || data?.username || usernameOrEmail,
        user_id: data?.user_id || data?.user?.user_id,
        expires_in: expiresIn,
      });

      // ✅ go connect (do not wait for /profile)
      router.push("/connect");
    } catch (err: any) {
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
                  What you’ll see inside
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
                    Username / Email
                  </label>
                  <input
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="you@company.com"
                    autoComplete="username"
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
                    required
                  />
                </div>

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
                  {loading ? "Signing in..." : "Continue"}
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
