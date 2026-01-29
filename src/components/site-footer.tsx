import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight">PostingExpert</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Silent automation for consistent social presence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Login
            </Link>
          </div>
        </div>
            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>© {new Date().getFullYear()} PostingExpert. All rights reserved.</p>
            <div className="flex gap-4">
      <Link
        href="/privacy-policy"
        className="opacity-80 transition-colors hover:text-foreground hover:underline"
      >
        Privacy
      </Link>

      <Link
        href="/privacy-policy"
        className="opacity-80 transition-colors hover:text-foreground hover:underline"
      >
        Terms
      </Link>
    </div>

        </div>
      </div>
    </footer>
  );
}
