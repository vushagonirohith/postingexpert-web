"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

// ✅ use aliases (avoid src/...) + add apiUpload
import { apiFetch, apiUpload, API_BASE } from "@/lib/api";
import { getToken, clearAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type Platforms = { instagram: boolean; linkedin: boolean; facebook: boolean };

export default function StudioPage() {
  const router = useRouter();
  const { ready } = useRequireAuth("/login");

  const [prompt, setPrompt] = useState("");
  const [numImages, setNumImages] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");

  // ✅ NEW: optional image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<Platforms>({
    instagram: false,
    linkedin: false,
    facebook: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [responseMessage, setResponseMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // queue
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const pollRef = useRef<any>(null);
  const [lastPayload, setLastPayload] = useState<any>(null);

  const [isMemeMode, setIsMemeMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("meme_mode");
    return saved === "true";
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const toggleMemeMode = () => {
    const next = !isMemeMode;
    setIsMemeMode(next);
    localStorage.setItem("meme_mode", String(next));
  };

  const handlePlatformChange = (name: keyof Platforms, checked: boolean) => {
    setPlatforms((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectAll = () => {
    setPlatforms({ instagram: true, linkedin: true, facebook: true });
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
        // NOTE: status endpoint doesn't require token in your old code.
        const res = await fetch(`${API_BASE}/queue/status/${id}`);
        const data = await res.json();

        setJobStatus(data.status);

        if (data.status === "completed") {
          const r = extractResultFromStatus(data);
          setResult(r);
          setResponseMessage("🎉 Content generated successfully!");
          setIsError(false);
          setIsLoading(false);
          clearInterval(pollRef.current);
          pollRef.current = null;
        } else if (data.status === "failed") {
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

  // ✅ NEW: image picker
  const handleImagePick = (file?: File) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setIsError(true);
      setResponseMessage("Only PNG / JPG / WEBP images are allowed.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setIsError(true);
      setResponseMessage("Image too large. Max 6MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const enqueue = async (payload: any) => {
    const token = getToken();
    if (!token) throw new Error("Missing token. Please login again.");

    // ✅ If image is attached -> multipart/form-data
    if (imageFile) {
      const fd = new FormData();

      // Append payload fields (objects as JSON strings)
      Object.entries(payload).forEach(([k, v]) => {
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });

      // Append the file
      fd.append("image", imageFile);

      // ✅ Same endpoint; backend must accept multipart for image
      const data = await apiUpload("/queue/enqueue", {
        method: "POST",
        formData: fd,
        token,
      });

      return data;
    }

    // ✅ Original JSON behavior (no image)
    const data = await apiFetch("/queue/enqueue", {
      method: "POST",
      body: payload,
      token,
    });

    return data;
  };

  const handleSubmit = async (e?: React.FormEvent, isRetry = false) => {
    e?.preventDefault();
    if (!(validateForm() || isRetry)) return;

    const userId =
      localStorage.getItem("username") || localStorage.getItem("user_id") || "";

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
          // ✅ optional hint for backend (if you want)
          has_image: !!imageFile,
        };

    setLastPayload(payload);

    try {
      const out = await enqueue(payload);
      const id = out.job_id || out.id || out.jobId;
      if (!id) throw new Error("Queue response missing job_id");

      setJobId(id);
      setJobStatus("queued");
      setResponseMessage("✅ Request queued successfully! Processing started…");

      pollStatus(id);
    } catch (err: any) {
      const msg = err?.message || "Failed to enqueue job. Please try again.";
      if (msg.toLowerCase().includes("authorization")) {
        clearAuth();
        router.replace("/login");
        return;
      }
      setIsLoading(false);
      setIsError(true);
      setResponseMessage(msg);
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

    // ✅ reset image
    removeImage();

    if (pollRef.current) clearInterval(pollRef.current);
  };

  const statusLabel = useMemo(() => {
    if (jobStatus === "in_progress") return "Processing…";
    if (jobStatus === "queued") return "Queued…";
    if (jobStatus === "completed") return "Completed";
    if (jobStatus === "failed") return "Failed";
    return jobStatus || "—";
  }, [jobStatus]);

  const isBusy =
    isLoading || jobStatus === "queued" || jobStatus === "in_progress";

  // auth gate
  if (!ready) return null;

  return (
    <>
      <SiteNavbar />
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Studio</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
                AI Content Studio
              </h1>
              <p className="mt-4 text-muted-foreground">
                Generate content + visuals, queue jobs, and auto-post to
                platforms.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Backend: {API_BASE}
              </p>
            </div>

            <button
              onClick={() => {
                clearAuth();
                router.push("/login");
              }}
              className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium hover:bg-muted"
              type="button"
            >
              Logout
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start">
            {/* Left help card */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <p className="text-sm font-medium">How it works</p>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>• You submit a theme + choices</li>
                <li>• We enqueue a job (token required)</li>
                <li>• We poll status until completed</li>
                <li>• Images / PDF links show here</li>
              </ul>

              <div className="mt-8 rounded-2xl border border-border bg-background p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Meme Mode</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generate meme-style content (templates + panels)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMemeMode}
                    disabled={isBusy}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      isMemeMode
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border bg-card text-foreground hover:bg-muted",
                      isBusy ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    {isMemeMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right form */}
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <p className="text-sm font-medium">Generate & Post</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Queue a job and track progress.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Marketing Theme
                  </label>

                  {/* ✅ NEW: plus icon + prompt input (same look as your UI) */}
                  <div className="mt-2 flex items-end gap-3">
                    <label
                      className={[
                        "flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-border",
                        "bg-background hover:bg-muted transition",
                        isBusy ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      title="Attach image (optional)"
                    >
                      +
                      <input
                        type="file"
                        hidden
                        disabled={isBusy}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleImagePick(e.target.files?.[0])}
                      />
                    </label>

                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                      placeholder="e.g., Promote eco-friendly products"
                      disabled={isBusy}
                    />
                  </div>

                  {/* ✅ NEW: optional image preview */}
                  {imagePreview && (
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Attached"
                          className="h-12 w-12 rounded-xl border border-border object-cover bg-card"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {imageFile?.name || "Attached image"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {imageFile
                              ? `${(imageFile.size / 1024).toFixed(1)} KB`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isBusy}
                        className="rounded-full border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {errors.prompt && (
                    <p className="mt-2 text-xs text-red-500">{errors.prompt}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Number of Images
                    </label>
                    <select
                      value={numImages}
                      onChange={(e) => setNumImages(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
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
                      className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
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

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {[
                      { key: "instagram" as const, label: "Instagram" },
                      { key: "linkedin" as const, label: "LinkedIn" },
                      { key: "facebook" as const, label: "Facebook" },
                    ].map((p) => {
                      const active = platforms[p.key];
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => handlePlatformChange(p.key, !active)}
                          disabled={isBusy}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left text-sm transition",
                            active
                              ? "border-primary/40 bg-primary/10"
                              : "border-border bg-background hover:bg-muted",
                            isBusy ? "opacity-60 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {errors.platforms && (
                    <p className="mt-2 text-xs text-red-500">
                      {errors.platforms}
                    </p>
                  )}
                </div>

                {responseMessage && (
                  <div
                    className={[
                      "rounded-2xl border p-4 text-sm",
                      isError
                        ? "border-red-500/40 bg-red-500/10"
                        : "border-emerald-500/40 bg-emerald-500/10",
                    ].join(" ")}
                  >
                    <p className="font-medium">
                      {isError ? "⚠️ " : "✅ "}
                      {responseMessage}
                    </p>

                    {isError && lastPayload && (
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e as any, true)}
                        disabled={isLoading}
                        className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    disabled={isBusy}
                    type="submit"
                    className={[
                      "w-full rounded-full px-6 py-3 text-sm font-medium shadow-sm transition",
                      isBusy
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    ].join(" ")}
                  >
                    {isBusy ? statusLabel : "Generate & Post"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
                  >
                    Reset
                  </button>
                </div>

                {(jobId || jobStatus) && (
                  <div className="mt-4 rounded-2xl border border-border bg-background p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Job ID</span>
                      <span className="font-medium">{jobId || "-"}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">{statusLabel}</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Tip: You’ll also receive updates via email (as per backend
                      flow).
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Results */}
          {result?.image_urls?.length > 0 && (
            <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-semibold">Generated Images</h3>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">
                {result.image_urls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Generated ${i + 1}`}
                      className="h-32 w-full rounded-2xl object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result?.pdf_url && (
            <div className="mt-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-semibold">PDF Document</h3>
              <a
                href={result.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Download PDF →
              </a>
            </div>
          )}
        </div>

        <SiteFooter />
      </main>
    </>
  );
}
