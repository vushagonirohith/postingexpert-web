"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { clearAuth, getToken } from "@/lib/auth";
import { listMyAssets, type UserAsset } from "@/lib/assets";

function isAuthErrorMessage(msg: string) {
  const m = (msg || "").toLowerCase();
  return (
    m.includes("401") ||
    m.includes("403") ||
    m.includes("unauthorized") ||
    m.includes("forbidden") ||
    m.includes("token") ||
    m.includes("authorization")
  );
}

function isPdf(a: UserAsset) {
  return a.type === "pdf" || a.meta_format === "pdf" || a.cdnUrl?.includes("/pdf");
}

function prettyDate(createdAt: string) {
  // createdAt is like: 2026-02-03T05:37:52Z#dd560...
  const iso = (createdAt || "").split("#")[0];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || createdAt;
  return d.toLocaleString();
}

export default function GalleryPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [items, setItems] = useState<UserAsset[]>([]);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "pdf">("all");
  const [selected, setSelected] = useState<UserAsset | null>(null);

  const load = async () => {
    const token = getToken();
    if (!token) {
      clearAuth();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const res = await listMyAssets(token);

      // Sort newest first based on createdAt prefix before #
      const sorted = (res.items || []).slice().sort((a, b) => {
        const da = new Date((a.createdAt || "").split("#")[0]).getTime();
        const db = new Date((b.createdAt || "").split("#")[0]).getTime();
        return db - da;
      });

      setItems(sorted);
    } catch (e: any) {
      const msg = e?.message || "Failed to load gallery.";
      if (isAuthErrorMessage(msg)) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((a) => {
      const pdf = isPdf(a);
      if (typeFilter === "pdf" && !pdf) return false;
      if (typeFilter === "image" && pdf) return false;

      if (!qq) return true;
      const hay =
        `${a.theme || ""} ${a.assetId || ""} ${a.s3Key || ""} ${a.meta_format || ""}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [items, q, typeFilter]);

  if (!ready) return null;

  return (
    <>
      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Library</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Your Gallery
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              View your past generated assets. Only you can see these.
            </p>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by theme, assetId, key..."
                className="w-full sm:w-96 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-muted"
              />

              <div className="flex gap-2">
                {(["all", "image", "pdf"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm",
                      typeFilter === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {t === "all" ? "All" : t === "image" ? "Images" : "PDFs"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={load}
              className="rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Errors */}
          {err && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-red-500">
              {err}
            </div>
          )}

          {/* Empty */}
          {!loading && !err && filtered.length === 0 && (
            <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No assets found. Generate something from{" "}
                <button
                  className="underline hover:text-foreground"
                  onClick={() => router.push("/studio")}
                >
                  Studio
                </button>
                .
              </p>
            </div>
          )}

          {/* Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((a) => {
              const pdf = isPdf(a);
              return (
                <button
                  key={`${a.createdAt}-${a.assetId}`}
                  type="button"
                  onClick={() => setSelected(a)}
                  className="group overflow-hidden rounded-3xl border border-border bg-card text-left shadow-sm hover:bg-muted"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-background">
                    {!pdf ? (
                      <Image
                        src={a.cdnUrl}
                        alt={a.theme || "Generated"}
                        fill
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
  <div className="relative h-full w-full overflow-hidden bg-black">
    <iframe
      src={`${a.cdnUrl}#page=1&view=FitV&toolbar=0&navpanes=0&scrollbar=0`}
      className="h-[140%] w-[140%] origin-top-left scale-[0.72]"
      style={{ pointerEvents: "none" }}
      scrolling="no"
      title="PDF Thumbnail"
    />
    <div className="absolute inset-0" />
    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
      PDF
    </div>
  </div>
)

}
                  </div>

                  <div className="p-4">
                    <p className="line-clamp-2 text-sm font-medium">
                      {a.theme || "Untitled"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {prettyDate(a.createdAt)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {pdf ? "pdf" : (a.meta_format || "image")}
                      {a.slideIndex ? ` • slide ${a.slideIndex}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <SiteFooter />
      </main>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selected.theme || "Asset"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {prettyDate(selected.createdAt)} • {selected.assetId}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
              {/* ✅ Preview Pane */}
              <div className="relative aspect-[4/5] w-full bg-black">
                {!isPdf(selected) ? (
                  <Image
                    src={selected.cdnUrl}
                    alt={selected.theme || "preview"}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <iframe
                    src={`${selected.cdnUrl}#toolbar=0&navpanes=0&view=FitH`}
                    className="h-full w-full"
                    title="PDF Preview"
                  />
                )}
              </div>

              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{isPdf(selected) ? "pdf" : "image"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium">{selected.meta_format || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">S3 Key</span>
                    <span className="ml-4 truncate font-medium" title={selected.s3Key}>
                      {selected.s3Key}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <a
                    href={selected.cdnUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                  >
                    Open / Download →
                  </a>

                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted"
                    onClick={async () => {
                      await navigator.clipboard.writeText(selected.cdnUrl);
                    }}
                  >
                    Copy CDN URL
                  </button>

                  {/* 🔧 Hook this to your backend "post" endpoint */}
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted"
                    onClick={() => {
                      // Example:
                      // apiFetch("/posts/publish", { method:"POST", token, body:{ assetId:selected.assetId }})
                      alert("Wire this button to your backend post endpoint.");
                    }}
                  >
                    Post this asset
                  </button>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  Tip: keep “Post this asset” server-side verified by token (never trust userId from browser).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
