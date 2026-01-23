"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { clearAuth } from "@/lib/auth";
// ==========================
// 🎤 Minimal Web Speech API types (works even if TS DOM libs don't include them)
// ==========================
type VoiceLang = "en-IN" | "hi-IN" | "te-IN";

type SpeechRecognitionCtor = new () => ISpeechRecognition;

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;

  start: () => void;
  stop: () => void;

  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<ISpeechRecognitionResult>;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

// ✅ Use API Gateway for queue endpoints (AWS way)
const GATEWAY =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  "https://4fqbpp1yya.execute-api.ap-south-1.amazonaws.com/prod";

type Platforms = {
  instagram: boolean;
  linkedin: boolean;
  facebook: boolean;
};

<<<<<<< HEAD
type VoiceLang = "en-IN" | "hi-IN" | "te-IN";

// Web Speech API types (TS-safe)
type SpeechRecognitionCtor = new () => SpeechRecognition;
type SpeechRecognitionLike = SpeechRecognition;

// Extend window for Chrome webkit
declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}
=======
type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};
>>>>>>> efb19e2d986c26f93632e3a04d4eec84dfaf0860

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

<<<<<<< HEAD
  // ==========================
  // 🎤 VOICE INPUT STATE
  // ==========================
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en-IN");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>(""); // committed transcript
  const startedByUserRef = useRef<boolean>(false); // avoid auto restarts after stop
=======
  // ✅ Upload UI (ChatGPT-style +)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
>>>>>>> efb19e2d986c26f93632e3a04d4eec84dfaf0860

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      // cleanup preview urls
      uploads.forEach((u) => URL.revokeObjectURL(u.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Init SpeechRecognition once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Voice input isn't supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += chunk;
        else interim += chunk;
      }

      if (finalText) {
        finalTranscriptRef.current = (
          (finalTranscriptRef.current || "") +
          " " +
          finalText
        )
          .replace(/\s+/g, " ")
          .trim();
        setPrompt(finalTranscriptRef.current);
      } else if (interim) {
        // show interim live while speaking
        const live = ((finalTranscriptRef.current || "") + " " + interim)
          .replace(/\s+/g, " ")
          .trim();
        setPrompt(live);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // common: not-allowed, service-not-allowed, no-speech, audio-capture
      setVoiceError(`Voice error: ${e.error}`);
      setIsListening(false);
      startedByUserRef.current = false;
    };

    recognition.onend = () => {
      // If user didn't explicitly stop (Chrome can end automatically), keep UI accurate
      setIsListening(false);
      startedByUserRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update recognition language when dropdown changes
  useEffect(() => {
    const r = recognitionRef.current;
    if (!r) return;

    // If currently listening, stop first, update lang, and allow user to restart
    const wasListening = isListening;
    if (wasListening) {
      try {
        r.stop();
      } catch (_) {}
      setIsListening(false);
    }

    r.lang = voiceLang;
    // Do not auto restart; user controls start/stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceLang]);

  const startVoice = () => {
    setVoiceError("");

    const r = recognitionRef.current;
    if (!r) {
      setVoiceError("Voice input isn't supported here. Use Chrome desktop.");
      return;
    }

    // base transcript should append to current prompt
    finalTranscriptRef.current = (prompt || "").trim();

    try {
      startedByUserRef.current = true;
      r.start();
      setIsListening(true);
    } catch (e) {
      // start() can throw if called twice fast
      setVoiceError("Could not start voice input. Try again.");
      setIsListening(false);
      startedByUserRef.current = false;
    }
  };

  const stopVoice = () => {
    const r = recognitionRef.current;
    if (!r) return;

    try {
      r.stop();
    } catch (_) {}

    setIsListening(false);
    startedByUserRef.current = false;

    // Make sure prompt is committed (remove any interim)
    setPrompt((prev) => prev.replace(/\s+/g, " ").trim());
    finalTranscriptRef.current = (prompt || "").replace(/\s+/g, " ").trim();
  };

  const toggleVoice = () => {
    if (isListening) stopVoice();
    else startVoice();
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

  // ✅ Upload handlers
  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    // only images
    const imageOnly = list.filter((f) => f.type.startsWith("image/"));
    if (!imageOnly.length) return;

    setUploads((prev) => {
      const next = [...prev];
      for (const file of imageOnly) {
        const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random()
          .toString(16)
          .slice(2)}`;
        next.push({ id, file, previewUrl: URL.createObjectURL(file) });
      }
      // optional: cap count
      return next.slice(0, 12);
    });
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearUploads = () => {
    setUploads((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u.previewUrl));
      return [];
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    isRetry: boolean = false
  ) => {
    e?.preventDefault();

    // ✅ auto-stop voice when user submits
    if (isListening) stopVoice();

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

    // NOTE: uploads are UI-only right now.
    // If you want to send them: upload to S3 first (presigned URLs) and add `asset_urls`.
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
          // asset_count: uploads.length, // optional, purely informative
        };

    setLastPayload(payload);

    try {
      const out = await enqueue(payload);

      const job_id = out?.job_id;
      if (!job_id) throw new Error("Queue response missing job_id");

      setJobId(job_id);
      setJobStatus("queued");
      setResponseMessage(
        "✅ Request queued successfully! You’ll get updates by email."
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
    // stop voice if running
    if (isListening) stopVoice();

    setPrompt("");
    finalTranscriptRef.current = "";
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
    clearUploads();

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

  const platformCount = useMemo(
    () => Object.values(platforms).filter(Boolean).length,
    [platforms]
  );

  if (!ready) return null;

  return (
    <>
      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                AI Content Studio
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Create content + visuals, queue it, and track status until done.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs">
                  Gateway:{" "}
                  <span className="text-muted-foreground">{GATEWAY}</span>
                </span>

                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs">
                  Platforms:{" "}
                  <span className="text-muted-foreground">{platformCount}</span>
                </span>

                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs">
                  Meme Mode:{" "}
                  <span className="text-muted-foreground">
                    {isMemeMode ? "On" : "Off"}
                  </span>
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-full border border-border bg-card px-5 py-2 text-sm font-medium hover:bg-muted md:w-auto"
              type="button"
            >
              Logout
            </button>
          </div>

<<<<<<< HEAD
          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-border bg-card p-6"
          >
            <div className="space-y-5">
              {/* Marketing Theme + Voice */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-muted-foreground">
                    Marketing Theme
                  </label>

                  {/* Language dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Voice language
                    </span>
                    <select
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value as VoiceLang)}
                      disabled={isBusy}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none disabled:opacity-60"
                      title="Select voice language"
                    >
                      <option value="en-IN">English (IN)</option>
                      <option value="hi-IN">Hindi (IN)</option>
                      <option value="te-IN">Telugu (IN)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      finalTranscriptRef.current = e.target.value; // keep voice base in sync
                    }}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
                    placeholder="E.g., Promote eco-friendly products"
                    required
                    disabled={isBusy}
                  />

                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isBusy}
                    className={[
                      "h-11 w-11 shrink-0 rounded-xl border border-border bg-card text-sm font-medium",
                      "hover:bg-muted disabled:opacity-60",
                      isListening ? "ring-2 ring-primary" : "",
                    ].join(" ")}
                    title={isListening ? "Stop voice input" : "Start voice input"}
                    aria-label={
                      isListening ? "Stop voice input" : "Start voice input"
                    }
                  >
                    {isListening ? "⏹️" : "🎤"}
                  </button>
                </div>

                {/* Voice status + errors */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    {isListening ? "Listening… speak now" : "Voice input ready"}
                  </div>
                  {voiceError && (
                    <div className="text-[11px] text-red-500">{voiceError}</div>
                  )}
                </div>

                {errors.prompt && (
                  <p className="mt-2 text-xs text-red-500">{errors.prompt}</p>
                )}
=======
          {/* Main grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: form */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-2 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create a new job</h2>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
                >
                  Reset
                </button>
>>>>>>> efb19e2d986c26f93632e3a04d4eec84dfaf0860
              </div>

              {/* Prompt */}
              <div className="mt-6">
                <label className="text-xs text-muted-foreground">
                  Marketing Theme / Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Example: Launch a premium winter sale for a D2C brand. Make it bold, minimal, and conversion-focused."
                />
                <div className="mt-2 flex items-center justify-between">
                  {errors.prompt ? (
                    <p className="text-xs text-red-500">{errors.prompt}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tip: include brand tone + offer + audience.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {prompt.length}/600
                  </p>
                </div>
              </div>

              {/* Upload Box */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">
                    Upload reference creatives (optional)
                  </label>
                  {uploads.length > 0 && (
                    <button
                      type="button"
                      onClick={clearUploads}
                      className="text-xs text-primary underline underline-offset-4"
                      disabled={isBusy}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={onDrop}
                  className={[
                    "mt-2 rounded-2xl border border-dashed p-4 transition",
                    isDragging
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-background",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    {/* ChatGPT-like + button */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-xl font-semibold hover:bg-muted disabled:opacity-60"
                      aria-label="Upload images"
                      title="Upload images"
                    >
                      +
                    </button>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        Add images to guide the design
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Drag & drop or click <span className="font-medium">+</span> (PNG/JPG/WebP). Up to 12.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        if (e.target.files) addFiles(e.target.files);
                        // reset input so same file can be selected again
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>

                  {/* Previews */}
                  {uploads.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                      {uploads.map((u) => (
                        <div
                          key={u.id}
                          className="group relative overflow-hidden rounded-xl border border-border bg-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u.previewUrl}
                            alt={u.file.name}
                            className="h-20 w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeUpload(u.id)}
                            className="absolute right-1 top-1 rounded-full border border-border bg-background/80 px-2 py-0.5 text-xs opacity-0 backdrop-blur transition group-hover:opacity-100"
                            title="Remove"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Number of Images
                  </label>
                  <select
                    value={numImages}
                    onChange={(e) => setNumImages(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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

              {/* Meme Mode */}
              <div className="mt-6 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Meme Mode</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isMemeMode
                        ? "✓ Meme templates + punchy captions enabled"
                        : "Turn on for meme-style content generation"}
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

              {/* Platforms */}
              <div className="mt-6">
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
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3"
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

              {/* Submit */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {isBusy ? statusLabel : "Generate & Post"}
                </button>
              </div>

              {/* Messages */}
              {responseMessage && (
                <div
                  className={[
                    "mt-5 rounded-2xl border p-4 text-sm",
                    isError
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-emerald-500/40 bg-emerald-500/10",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="leading-relaxed">{responseMessage}</p>
                    {jobStatus && (
                      <span className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs">
                        {statusLabel}
                      </span>
                    )}
                  </div>

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
            </form>

            {/* Right: status + results */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold">Job Status</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Job ID</span>
                    <span className="font-medium">{jobId || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{statusLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uploads</span>
                    <span className="font-medium">{uploads.length}</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pro tip: If you upload references, we can later use them to
                    keep brand consistency (colors, typography, layout).
                  </p>
                </div>
              </div>

              {result?.image_urls?.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold">Generated Images</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {result.image_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-2xl border border-border bg-background hover:bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Generated ${i + 1}`}
                          className="h-28 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {result?.pdf_url && (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold">PDF Document</h3>
                  <a
                    href={result.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Download PDF →
                  </a>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
