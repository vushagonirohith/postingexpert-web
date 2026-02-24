"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/brands", label: "Brands" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6">
      {/* Logo */}
      <div className="px-2">
        <p className="text-sm font-semibold tracking-tight">PostingExpert</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Silent automation
        </p>
      </div>
      {/* Nav */}
      <nav className="mt-10 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-xl px-4 py-2.5 text-sm transition",
                active
                  ? "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="mt-auto px-2 pt-8 text-xs text-muted-foreground">
        Auto Mode: <span className="text-foreground">ON</span>
      </div>
    </aside>
  );
}
