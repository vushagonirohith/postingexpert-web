"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, clearAuth } from "src/lib/auth";

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  // ✅ Mobile menu state
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // read auth from localStorage (client-side)
    setAuthed(!!getToken());
  }, [pathname]);

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const onLogout = () => {
    clearAuth();
    setAuthed(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">
            PostingExpert
          </span>
        </Link>

        {/* Center navigation (desktop only) */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/how-it-works"
            className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            How it works
          </Link>

          <Link
            href="/pricing"
            className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Pricing
          </Link>

          {authed && (
            <>
              <Link
                href="/connect"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Connect
              </Link>

              <Link
                href="/analytics"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Analytics
              </Link>

              <Link
                href="/gallery"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Gallery
              </Link>

              <Link
                href="/settings"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Settings
              </Link>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* ✅ Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>

          {!authed ? (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="hidden sm:inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="hidden sm:inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ✅ Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/how-it-works"
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                How it works
              </Link>

              <Link
                href="/pricing"
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Pricing
              </Link>

              {!authed ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/connect"
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Connect
                  </Link>

                  <Link
                    href="/analytics"
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Analytics
                  </Link>

                  {/* ✅ ADD THIS */}
                  <Link
                    href="/gallery"
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Gallery
                  </Link>

                  <Link
                    href="/settings"
                    className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-2 rounded-xl bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
