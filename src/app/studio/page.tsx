// src/app/studio/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { getToken, clearAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Platforms = { instagram: boolean; linkedin: boolean; facebook: boolean };

type QueueStatus = "queued" | "in_progress" | "completed" | "failed" | string;

export default function StudioPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  // ✅ IMPORTANT: Content/Queue backend base
  // In production this MUST be HTTPS (otherwise browser blocks it)
  const CONTENT_API_BASE =
    process.env.NEXT_PUBLIC_CONTENT_API_BASE?.trim() || "http://13.233.45.167:5000";

  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");

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
  const [jobStatus, setJobStatus] = useState<QueueStatus | null>(null);
  const [result, setResult] = useState<any>(null);

  const pollRef = useRef<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  // Meme Mode
  const [isMemeMode, setIsMemeMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("meme_mode") === "true";
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isBusy = isLoading || jobStatus === "queued" || jobStatus === "in_progress";

  const statusLabel = useMemo(() => {
    if (jobStatus === "in_progress") return "Processing…";
    if (jobStatus === "queued") return "Queued…";
    if (jobStatus === "completed") return "Completed";
    if (jobStatus === "failed") return "Failed";
    return jobStatus || "—";
  }, [jobStatus]);

  const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPlatforms((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectAll = () => {
    setPlatforms({ instagram: true, linkedin: true, facebook: true });
  };

  const toggleMemeMode = () => {
    const next = !isMemeMode;
    setIsMemeMode(next);
    localStorage.setItem("meme_mode", String(next));
  };

  const handleLogout = async () => {
    clearAuth();
    router.push("/login");
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
        const res = await fetch(`${CONTENT_API_BASE}/queue/status/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json().catch(() => ({}));
        const s: QueueStatus = data?.status || data?.job_status || "unknown";
        setJobStatus(s);

        if (s === "completed") {
          const r = extractResultFromStatus(data);
          setResult(r);
          setResponseMessage("🎉 Content generated successfully! Check your email for download links.");
          setIsError(false);
          setIsLoading(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (s === "failed") {
          const errText = extractErrorFromStatus(data) || "Job failed. Please try again.";
          setIsLoading(false);
          setIsError(true);
          setResponseMessage(errText);
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (e) {
        setIsLoading(false);
        setIsError(true);
        setResponseMessage("Failed to fetch job status.");
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 2000);
  };

  const enqueue = async (payload: any) => {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${CONTENT_API_BASE}/queue/enqueue`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  };

  const handleSubmit = async (e?: React.FormEvent, isRetry = false) => {
    e?.preventDefault();
    if (!(validateForm() || isRetry)) return;

    const userId =
      localStorage.getItem("username") ||
      localStorage.getItem("user_id") ||
      "";

    const username =
      localStorage.getItem("username") ||
      userId ||
      "";

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
          prompt,
          numImages: Number(numImages),
          contentType,
          user_id: userId,
          username,
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
      const data = await enqueue(payload);
      const id = data?.job_id || data?.jobId;
      if (!id) throw new Error("Job ID not returned from server.");

      setJobId(id);
      setJobStatus("queued");
      setResponseMessage("✅ Request queued successfully! Check your email for updates on processing status.");

      pollStatus(id);
    } catch (err: any) {
      setIsLoading(false);
      setIsError(true);
      setResponseMessage(err?.message || "Failed to enqueue job. Please try again.");
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
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Studio</div>
              <h1 className="text-4xl font-semibold tracking-tight">AI Content Studio</h1>
              <p className="mt-2 text-muted-foreground">
                Generate content + visuals, queue jobs, and auto-post to platforms.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Backend: {CONTENT_API_BASE}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-full border px-4 py-2 text-sm hover:bg-black/5"
              type="button"
            >
              Logout
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left card */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium">How it works</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>You submit a theme + choices</li>
                <li>We enqueue a job (token required)</li>
                <li>We poll status until completed</li>
                <li>Images / PDF links show here</li>
              </ul>

              <div className="mt-6 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Meme Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Generate meme-style content (templates + panels)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleMemeMode}
                    disabled={isBusy}
                    className="rounded-full border px-4 py-2 text-sm hover:bg-black/5 disabled:opacity-50"
                  >
                    {isMemeMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right card (Form) */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium">Generate & Post</h2>
              <p className="mt-1 text-sm text-muted-foreground">Queue a job and track progress.</p>

              <form onSubmit={(e) => handleSubmit(e, false)} className="mt-5 space-y-4">
                <div>
                  <label className="text-sm font-medium">Marketing Theme</label>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Promote eco-friendly products"
                    className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                  />
                  {errors.prompt && <div className="mt-1 text-xs text-red-600">{errors.prompt}</div>}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Number of Images</label>
                    <select
                      value={numImages}
                      onChange={(e) => setNumImages(e.target.value)}
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                    >
                      <option value="" disabled>
                        Choose number
                      </option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    {errors.numImages && <div className="mt-1 text-xs text-red-600">{errors.numImages}</div>}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Content Type</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none"
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
                    {errors.contentType && <div className="mt-1 text-xs text-red-600">{errors.contentType}</div>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Target Platforms</label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Select all
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {(["instagram", "linkedin", "facebook"] as const).map((key) => (
                      <label
                        key={key}
                        className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm ${
                          platforms[key] ? "bg-black/5" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={key}
                          checked={platforms[key]}
                          onChange={handlePlatformChange}
                          className="hidden"
                        />
                        {key === "instagram" ? "Instagram" : key === "linkedin" ? "LinkedIn" : "Facebook"}
                      </label>
                    ))}
                  </div>

                  {errors.platforms && <div className="mt-1 text-xs text-red-600">{errors.platforms}</div>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="flex-1 rounded-full bg-indigo-200 px-5 py-3 text-sm font-medium hover:bg-indigo-300 disabled:opacity-60"
                  >
                    {isBusy ? statusLabel : "Generate & Post"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="rounded-full border px-5 py-3 text-sm hover:bg-black/5 disabled:opacity-60"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {/* Queue status */}
              {(jobId || jobStatus) && (
                <div className="mt-5 rounded-xl border p-4 text-sm">
                  <div className="flex justify-between">
                    <div className="text-muted-foreground">Job ID</div>
                    <div className="font-mono">{jobId || "-"}</div>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">{statusLabel}</div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">📧 Check your email for detailed updates</div>
                </div>
              )}

              {/* Response Message */}
              {responseMessage && (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm ${
                    isError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>{responseMessage}</div>

                    {isError && lastPayload && (
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e as any, true)}
                        disabled={isLoading}
                        className="rounded-full border px-3 py-1 text-xs hover:bg-black/5 disabled:opacity-60"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Assets */}
              {result?.image_urls?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium">Generated Images</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {result.image_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="overflow-hidden rounded-xl border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Generated ${i + 1}`} className="h-40 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {result?.pdf_url && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium">LinkedIn/PDF Document</h3>
                  <a
                    href={result.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-black/5"
                  >
                    📄 Download PDF →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
