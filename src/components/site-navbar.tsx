"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken, clearAuth } from "src/lib/auth";

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    // read auth from localStorage (client-side)
    setAuthed(!!getToken());
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

        {/* Center navigation */}
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

          {/* Show Connect only when logged in (keeps your style) */}
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
          {!authed ? (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}