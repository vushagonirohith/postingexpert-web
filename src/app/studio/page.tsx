"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { clearAuth } from "@/lib/auth";

// ✅ Use API Gateway for queue endpoints (AWS way)
const GATEWAY =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  "https://4fqbpp1yya.execute-api.ap-south-1.amazonaws.com/prod";

type Platforms = {
  instagram: boolean;
  linkedin: boolean;
  facebook: boolean;
};

export default function StudioPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState("");
  const [contentType, setContentType] = useState("");

  const [platforms, setPlatforms] = useState<Platforms>({
    instagram: false,
    linkedin: false,
    facebook: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [responseMessage, setResponseMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // queue state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const pollRef = useRef<any>(null);

  const [lastPayload, setLastPayload] = useState<any>(null);

  // Meme Mode
  const [isMemeMode, setIsMemeMode] = useState<boolean>(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("meme_mode") : null;
    return saved === "true";
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSelectAll = () => {
    setPlatforms({ instagram: true, linkedin: true, facebook: true });
  };

  const toggleMemeMode = () => {
    const next = !isMemeMode;
    setIsMemeMode(next);
    localStorage.setItem("meme_mode", String(next));
  };

  const handleLogout = async () => {
    await new Promise((r) => setTimeout(r, 300));
    clearAuth();
    router.replace("/login");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!prompt.trim()) newErrors.prompt = "Marketing theme is required";
    if (!numImages) newErrors.numImages = "Please select the number of images";
    if (!contentType) newErrors.contentType = "Please select a content type";
    if (!Object.values(platforms).includes(true)) {
      newErrors.platforms = "Please select at least one platform";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const extractResultFromStatus = (data: any) => {
    const meta = data?.meta || {};
    return meta.result || data.result || data.output || null;
  };

  const extractErrorFromStatus = (data: any) => {
    const meta = data?.meta || {};
    return meta.error || data.error || null;
  };

  const pollStatus = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        // ✅ Poll through API Gateway
        const { data } = await axios.get(`${GATEWAY}/queue/status/${id}`, {
          headers: {
            Authorization:
              typeof window !== "undefined" && localStorage.getItem("token")
                ? `Bearer ${localStorage.getItem("token")}`
                : "",
          },
        });

        setJobStatus(data?.status);

        if (data?.status === "completed") {
          const r = extractResultFromStatus(data);
          setResult(r);
          setResponseMessage(
            "🎉 Content generated successfully! Check your email for download links."
          );
          setIsError(false);
          setIsLoading(false);

          clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (data?.status === "failed") {
          const errText =
            extractErrorFromStatus(data) || "Job failed. Please try again.";
          setIsLoading(false);
          setIsError(true);
          setResponseMessage(errText);

          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        setIsLoading(false);
        setIsError(true);
        setResponseMessage("Failed to fetch job status.");

        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 2000);
  };

  const enqueue = async (payload: any) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // ✅ Enqueue through API Gateway
    const { data } = await axios.post(`${GATEWAY}/queue/enqueue`, payload, {
      headers,
    });

    return data;
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    isRetry: boolean = false
  ) => {
    e?.preventDefault();

    if (!(validateForm() || isRetry)) return;

    const userId =
      localStorage.getItem("username") ||
      localStorage.getItem("user_id") ||
      "";

    const username = localStorage.getItem("username") || userId || "";

    if (!userId || !username) {
      setIsError(true);
      setResponseMessage("You must be logged in. Missing user credentials.");
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setResponseMessage("");
    setResult(null);
    setJobStatus(null);
    setJobId(null);

    const payload = isRetry
      ? lastPayload
      : {
          prompt: prompt.trim(),
          numImages: Number(numImages),
          contentType,
          user_id: userId,
          username: username,
          platforms: {
            instagram: platforms.instagram,
            linkedin: platforms.linkedin,
            facebook: platforms.facebook,
          },
          meme: isMemeMode,
          meme_mode: isMemeMode,
        };

    setLastPayload(payload);

    try {
      const out = await enqueue(payload);

      const job_id = out?.job_id;
      if (!job_id) throw new Error("Queue response missing job_id");

      setJobId(job_id);
      setJobStatus("queued");
      setResponseMessage(
        "✅ Request queued successfully! Check your email for updates on processing status."
      );
      setIsError(false);

      pollStatus(job_id);
    } catch (err: any) {
      setIsLoading(false);
      setIsError(true);

      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to enqueue job. Please try again.";

      setResponseMessage(msg);

      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        clearAuth();
        router.replace("/login");
      }
    }
  };

  const handleReset = () => {
    setPrompt("");
    setNumImages("");
    setContentType("");
    setPlatforms({ instagram: false, linkedin: false, facebook: false });
    setErrors({});
    setResponseMessage("");
    setIsError(false);
    setLastPayload(null);
    setResult(null);
    setJobStatus(null);
    setJobId(null);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const statusLabel = (() => {
    if (jobStatus === "in_progress") return "Processing…";
    if (jobStatus === "queued") return "Queued…";
    if (jobStatus === "completed") return "Completed";
    if (jobStatus === "failed") return "Failed";
    return jobStatus || "—";
  })();

  const isBusy =
    isLoading || jobStatus === "queued" || jobStatus === "in_progress";

  if (!ready) return null;

  return (
    <>
      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">AI Content Studio</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Queue jobs on EC2 and track status until done.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Gateway: {GATEWAY}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium hover:bg-muted"
              type="button"
            >
              Logout
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-border bg-card p-6"
          >
            <div className="space-y-5">
              {/* Marketing Theme */}
              <div>
                <label className="text-xs text-muted-foreground">
                  Marketing Theme
                </label>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
                    placeholder="E.g., Promote eco-friendly products"
                    required
                    disabled={isBusy}
                  />
                </div>

                {errors.prompt && (
                  <p className="mt-2 text-xs text-red-500">{errors.prompt}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Number of Images
                  </label>
                  <select
                    value={numImages}
                    onChange={(e) => setNumImages(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
                    required
                    disabled={isBusy}
                  >
                    <option value="" disabled>
                      Choose number
                    </option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={String(n)}>
                        {n} Image{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.numImages && (
                    <p className="mt-2 text-xs text-red-500">
                      {errors.numImages}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
                    required
                    disabled={isBusy}
                  >
                    <option value="" disabled>
                      Choose style
                    </option>
                    {[
                      { value: "Informative", label: "📚 Informative" },
                      { value: "Inspirational", label: "💫 Inspirational" },
                      { value: "Promotional", label: "🎉 Promotional" },
                      { value: "Educational", label: "🎓 Educational" },
                      { value: "Engaging", label: "🔥 Engaging" },
                    ].map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.contentType && (
                    <p className="mt-2 text-xs text-red-500">
                      {errors.contentType}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Meme Mode</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isMemeMode
                        ? "✓ Meme templates, captions enabled"
                        : "Turn on to generate meme-style content"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMemeMode}
                    disabled={isBusy}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
                  >
                    {isMemeMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">
                    Target Platforms
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary underline underline-offset-4"
                    disabled={isBusy}
                  >
                    Select all
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {(
                    [
                      ["instagram", "Instagram"],
                      ["linkedin", "LinkedIn"],
                      ["facebook", "Facebook"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={platforms[key]}
                        onChange={(e) =>
                          setPlatforms((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        disabled={isBusy}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                {errors.platforms && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.platforms}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {isBusy ? statusLabel : "Generate & Post"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  Reset
                </button>
              </div>

              {(jobId || jobStatus) && (
                <div className="rounded-xl border border-border bg-background p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Job ID</span>
                    <span className="font-medium">{jobId || "-"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{statusLabel}</span>
                  </div>
                </div>
              )}

              {responseMessage && (
                <div
                  className={[
                    "rounded-xl border p-4 text-sm",
                    isError
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-emerald-500/40 bg-emerald-500/10",
                  ].join(" ")}
                >
                  {responseMessage}

                  {isError && lastPayload && (
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e as any, true)}
                      disabled={isLoading}
                      className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </form>

          {result?.image_urls?.length > 0 && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">Generated Images</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {result.image_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Generated ${i + 1}`}
                      className="h-28 w-full rounded-xl object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result?.pdf_url && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold">PDF Document</h3>
              <a
                href={result.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Download PDF →
              </a>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
