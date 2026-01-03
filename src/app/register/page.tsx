// src/app/register/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";
import { saveAuth } from "@/lib/auth";

// ✅ CHANGED: use your shared api helper (env-based, starts EC2 via gateway)
import { apiFetch, API_BASE } from "@/lib/api";

// ---- constants ----
const INDUSTRIES = [
  "EdTech",
  "SaaS",
  "Agency",
  "D2C / E-commerce",
  "Real Estate",
  "Healthcare",
  "Finance",
  "Restaurant / Cafe",
  "Fitness",
  "Other",
] as const;

const TONES = [
  { value: "premium", label: "Minimal / Premium" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "bold", label: "Bold" },
  { value: "fun", label: "Fun / Trendy" },
] as const;

const GOALS = [
  "Product updates",
  "Educational posts",
  "Testimonials / case studies",
  "Offers / promotions",
  "Hiring / culture",
  "Behind-the-scenes",
  "Industry insights",
] as const;

const FREQUENCY = [
  { value: "3wk", label: "3 posts / week" },
  { value: "5wk", label: "5 posts / week" },
  { value: "daily", label: "Daily" },
] as const;

type Tone = (typeof TONES)[number]["value"];
type Frequency = (typeof FREQUENCY)[number]["value"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function readFileAsBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function usernameLooksValid(u: string) {
  return /^[a-zA-Z0-9_]{3,}$/.test(u.trim());
}

// ❌ REMOVED: FALLBACK_PROD + postJson helper
// ✅ Now everything uses apiFetch() from src/lib/api.js (env-based)

export default function RegisterPage() {
  const router = useRouter();

  // ---- wizard steps ----
  const STEPS = useMemo(
    () =>
      [
        { key: "account", title: "Account" },
        { key: "brand", title: "Brand" },
        { key: "content", title: "Content" },
        { key: "assets", title: "Assets" },
        { key: "review", title: "Review" },
      ] as const,
    []
  );

  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  // ✅ ADDED: warmup to start EC2 via API Gateway/Lambda (safe if endpoint doesn't exist)
  useEffect(() => {
    (async () => {
      try {
        console.log("🔥 Register warmup via API_BASE:", API_BASE);
        await apiFetch("/warmup", { method: "GET" });
      } catch (e) {
        console.warn("⚠️ Register warmup failed (safe):", e);
      }
    })();
  }, []);

  // ---- form state ----
  const [form, setForm] = useState({
    // old register
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",

    // brand
    brandName: "",
    industry: "EdTech" as (typeof INDUSTRIES)[number],
    tone: "premium" as Tone,

    // content prefs
    goals: [] as string[],
    aiImages: true,
    frequency: "5wk" as Frequency,
    postScheduleTime: "10:00",

    // survey-like details
    contactDetails: "",
    numColors: 2,
    colors: ["#0a0e43", "#c27070", "#000000", "#000000", "#000000"] as string[],

    // logo
    logoFile: null as File | null,
    logoPreview: "" as string, // base64 data-url
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const goalsCount = form.goals.length;

  // ---- handlers ----
  const toggleGoal = (goal: string) => {
    setForm((prev) => {
      const exists = prev.goals.includes(goal);
      const next = exists
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal].slice(0, 3); // limit to 3
      return { ...prev, goals: next };
    });
  };

  const onLogoPick = async (file: File | null) => {
    setErrorMsg("");
    if (!file) {
      setForm((p) => ({ ...p, logoFile: null, logoPreview: "" }));
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Please upload a PNG, JPG, or SVG file.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Logo file size must be less than 5MB.");
      return;
    }

    const base64 = await readFileAsBase64(file);
    setForm((p) => ({ ...p, logoFile: file, logoPreview: base64 }));
  };

  const setColorCount = (count: number) => {
    const next = clamp(count, 2, 5);
    setForm((p) => ({ ...p, numColors: next }));
  };

  const setColorAt = (idx: number, value: string) => {
    setForm((p) => {
      const next = [...p.colors];
      next[idx] = value;
      return { ...p, colors: next };
    });
  };

  // ---- step validation ----
  const stepValid = useMemo(() => {
    if (step === 0) {
      if (form.fullName.trim().length < 2) return false;
      if (!emailLooksValid(form.email)) return false;
      if (!usernameLooksValid(form.username)) return false;
      if (form.password.length < 6) return false;
      if (form.password !== form.confirmPassword) return false;
      return true;
    }

    if (step === 1) {
      if (form.brandName.trim().length < 2) return false;
      if (!form.industry) return false;
      if (!form.tone) return false;
      return true;
    }

    if (step === 2) {
      if (form.goals.length < 1) return false;
      if (!form.frequency) return false;
      if (!form.postScheduleTime) return false;
      return true;
    }

    if (step === 3) {
      if (form.numColors < 2 || form.numColors > 5) return false;
      return true;
    }

    if (step === 4) return true;

    return false;
  }, [step, form]);

  const goNext = () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!stepValid) {
      setErrorMsg("Please complete the required fields in this step.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---- ✅ SUBMIT (FIXED for your current backend) ----
  // Your backend saves survey inside /user/register when payload has surveyData.
  const onSubmitAll = async () => {
    if (loading) return;

    setErrorMsg("");
    setSuccessMsg("");

    if (
      form.fullName.trim().length < 2 ||
      !emailLooksValid(form.email) ||
      !usernameLooksValid(form.username) ||
      form.password.length < 6 ||
      form.password !== form.confirmPassword ||
      form.brandName.trim().length < 2 ||
      form.goals.length < 1
    ) {
      setErrorMsg(
        "Some required fields are missing. Please go back and complete all steps."
      );
      return;
    }

    setLoading(true);

    try {
      // 1) REGISTER user (normal register)
      const registerPayload = {
        name: form.fullName.trim(),
        email: form.email.toLowerCase().trim(),
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      };

      // ✅ CHANGED: postJson -> apiFetch
      const reg: any = await apiFetch("/user/register", {
        method: "POST",
        body: registerPayload,
      });

      const token =
        reg?.token || reg?.access_token || reg?.jwt || reg?.data?.token;

      localStorage.setItem("registeredUserId", form.username.trim());
      localStorage.setItem("username", form.username.trim());

      if (token) {
        saveAuth({
          token,
          username: reg?.user?.username || reg?.username || form.username.trim(),
          user_id: reg?.user_id,
          expires_in: reg?.expires_in || reg?.expiresIn,
        });
      }

      // 2) SAVE SURVEY / ONBOARDING DATA using SAME endpoint (/user/register)
      // ✅ Must match your backend contract exactly: { surveyData: { userId, businessType, answers, timestamp } }
      const colors = form.colors.slice(0, form.numColors);

      const answers: Record<string, any> = {
        // ✅ keep the keys your get_profile reads
        post_schedule_time: form.postScheduleTime,
        color_theme: colors,

        // ✅ other useful fields (safe to store)
        brand_name: form.brandName.trim(),
        tone: form.tone,
        goals: form.goals,
        ai_images: form.aiImages,
        frequency: form.frequency,
        contact_details: form.contactDetails,

        // ✅ logo in the exact structure upload_logo_to_s3 expects
        business_logo: form.logoFile
          ? {
              fileName: form.logoFile.name,
              fileType: form.logoFile.type,
              fileSize: form.logoFile.size,
              data: form.logoPreview, // data-url (your backend already strips prefix)
            }
          : null,
      };

      const surveyPayload = {
        surveyData: {
          userId: form.username.trim(), // backend uses this as partition key
          businessType: form.industry, // backend stores as business_type
          answers,
          timestamp: new Date().toISOString(),
        },
      };

      // ✅ CHANGED: postJson -> apiFetch
      await apiFetch("/user/register", {
        method: "POST",
        body: surveyPayload,
      });

      // local storage convenience
      localStorage.setItem("brand_name", form.brandName.trim());
      localStorage.setItem("business_type", form.industry);

      setSuccessMsg("Registration successful! Redirecting...");
      setTimeout(() => {
        router.push(token ? "/connect" : "/login");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- UI helpers ----
  const progressPct = useMemo(() => {
    const denom = STEPS.length - 1;
    return Math.round((step / denom) * 100);
  }, [step, STEPS.length]);

  const slideStyle: React.CSSProperties = {
    transform: `translateX(-${step * 100}%)`,
    transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <>
      <SiteNavbar />
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            {/* LEFT */}
            <div className="max-w-xl">
              <p className="text-sm text-muted-foreground">
                PostingExpert • Signup
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Create your workspace in minutes.
              </h1>
              <p className="mt-5 text-muted-foreground">
                We’ll collect the details once — then PostingExpert can generate
                content that matches your brand and schedule automatically.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Progress</p>
                  <p className="text-xs text-muted-foreground">{progressPct}%</p>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${progressPct}%`,
                      transition: "width 280ms ease",
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2">
                  {STEPS.map((s, idx) => {
                    const active = idx === step;
                    const done = idx < step;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setStep(idx)}
                        className={[
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                          active
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-background hover:bg-muted",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={[
                              "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                              done
                                ? "bg-primary text-primary-foreground"
                                : active
                                ? "bg-primary/20 text-foreground"
                                : "bg-muted text-muted-foreground",
                            ].join(" ")}
                          >
                            {done ? "✓" : idx + 1}
                          </span>
                          {s.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {done ? "Done" : active ? "Current" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Tip: You can click steps to jump — but “Next” validates inputs
                  so nothing gets missed.
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="rounded-3xl border border-border bg-card shadow-sm md:p-8 flex flex-col h-[720px] overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {STEPS[step]?.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
                    >
                      ← Back
                    </button>
                  ) : null}

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!stepValid}
                      className={[
                        "rounded-full px-5 py-2 text-sm font-medium shadow-sm transition",
                        stepValid
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed",
                      ].join(" ")}
                    >
                      Next →
                    </button>
                  ) : null}
                </div>
              </div>

              {errorMsg ? (
                <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              ) : null}

              {successMsg ? (
                <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {successMsg}
                </div>
              ) : null}

              {/* slider */}
              <div ref={scrollRef} className="mt-6 flex-1 overflow-y-auto">
                <div className="relative">
                  <div className="flex" style={slideStyle}>
                    {/* STEP 1 */}
                    <div className="min-w-full px-3">
                      <div className="pr-2 space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Full name
                          </label>
                          <input
                            value={form.fullName}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                fullName: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="Your full name"
                            autoComplete="name"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Email
                          </label>
                          <input
                            value={form.email}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, email: e.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="you@company.com"
                            autoComplete="email"
                          />
                          {!form.email ? null : emailLooksValid(form.email) ? null : (
                            <p className="mt-2 text-xs text-destructive">
                              Please enter a valid email.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Username
                          </label>
                          <input
                            value={form.username}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                username: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="e.g. Vishakha"
                            autoComplete="username"
                          />
                          {!form.username ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Letters, numbers, underscores only. Min 3
                              characters.
                            </p>
                          ) : usernameLooksValid(form.username) ? null : (
                            <p className="mt-2 text-xs text-destructive">
                              Username must be 3+ chars and only
                              letters/numbers/_.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Password
                          </label>
                          <input
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                password: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          {!form.password ? null : form.password.length >= 6 ? null : (
                            <p className="mt-2 text-xs text-destructive">
                              Password must be at least 6 characters.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Confirm password
                          </label>
                          <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          {!form.confirmPassword ? null : form.password === form.confirmPassword ? null : (
                            <p className="mt-2 text-xs text-destructive">
                              Passwords do not match.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STEP 2 */}
                    <div className="min-w-full px-3">
                      <div className="h-full overflow-y-auto pr-2 space-y-5">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Brand name
                          </label>
                          <input
                            value={form.brandName}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                brandName: e.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="e.g., Posting Expert"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Industry
                          </label>
                          <select
                            value={form.industry}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                industry: e.target.value as any,
                              }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                          >
                            {INDUSTRIES.map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Brand tone
                          </label>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TONES.map((t) => {
                              const active = form.tone === t.value;
                              return (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() =>
                                    setForm((p) => ({ ...p, tone: t.value }))
                                  }
                                  className={[
                                    "rounded-2xl border px-4 py-3 text-left text-sm transition",
                                    active
                                      ? "border-primary/40 bg-primary/10"
                                      : "border-border bg-background hover:bg-muted",
                                  ].join(" ")}
                                >
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3 */}
                    <div className="min-w-full px-3">
                      <div className="h-full overflow-y-auto pr-2 space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Content goals (choose up to 3)
                          </label>
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {GOALS.map((g) => {
                              const active = form.goals.includes(g);
                              const disabled = !active && form.goals.length >= 3;
                              return (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => toggleGoal(g)}
                                  disabled={disabled}
                                  className={[
                                    "rounded-2xl border px-4 py-3 text-left text-sm transition",
                                    active
                                      ? "border-primary/40 bg-primary/10"
                                      : "border-border bg-background hover:bg-muted",
                                    disabled ? "cursor-not-allowed opacity-50" : "",
                                  ].join(" ")}
                                >
                                  {g}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Selected: {goalsCount}/3
                          </p>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                AI-generated images
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                If enabled, PostingExpert generates on-brand visuals automatically.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setForm((p) => ({ ...p, aiImages: !p.aiImages }))
                              }
                              className={[
                                "rounded-full px-4 py-2 text-sm font-medium transition",
                                form.aiImages
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "border border-border bg-card text-foreground hover:bg-muted",
                              ].join(" ")}
                            >
                              {form.aiImages ? "Enabled" : "Disabled"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Posting frequency
                          </label>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {FREQUENCY.map((f) => {
                              const active = form.frequency === f.value;
                              return (
                                <button
                                  key={f.value}
                                  type="button"
                                  onClick={() =>
                                    setForm((p) => ({ ...p, frequency: f.value }))
                                  }
                                  className={[
                                    "rounded-2xl border px-3 py-3 text-center text-sm transition",
                                    active
                                      ? "border-primary/40 bg-primary/10"
                                      : "border-border bg-background hover:bg-muted",
                                  ].join(" ")}
                                >
                                  {f.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground">
                            Daily post time
                          </label>
                          <input
                            type="time"
                            value={form.postScheduleTime}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, postScheduleTime: e.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">
                            We’ll schedule posts around this time (you can change later).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* STEP 4 */}
                    <div className="min-w-full px-3">
                      <div className="h-full overflow-y-auto pr-2 space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            Contact details for footers (optional)
                          </label>
                          <textarea
                            value={form.contactDetails}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, contactDetails: e.target.value }))
                            }
                            className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder={"Website: www.example.com\nContact: +91 98765 43210"}
                            rows={4}
                          />
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                Brand colors
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Choose 2–5 colors used in your posts.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Count</span>
                              <input
                                type="number"
                                min={2}
                                max={5}
                                value={form.numColors}
                                onChange={(e) =>
                                  setColorCount(parseInt(e.target.value || "2", 10))
                                }
                                className="w-16 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-2">
                            {Array.from({ length: form.numColors }, (_, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-foreground">
                                    Color {i + 1}
                                  </span>
                                  <div
                                    className="h-5 w-5 rounded-full border border-border"
                                    style={{ backgroundColor: form.colors[i] }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {form.colors[i]}
                                  </span>
                                </div>

                                <input
                                  type="color"
                                  value={form.colors[i]}
                                  onChange={(e) => setColorAt(i, e.target.value)}
                                  className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-background p-1"
                                  aria-label={`Pick color ${i + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-sm font-medium text-foreground">
                            Business logo (optional)
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PNG, JPG, SVG • max 5MB. Used on templates & branding.
                          </p>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                              onChange={(e) => onLogoPick(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                            />

                            {form.logoFile ? (
                              <button
                                type="button"
                                onClick={() => onLogoPick(null)}
                                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>

                          {form.logoPreview ? (
                            <div className="mt-4 rounded-2xl border border-border bg-card p-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={form.logoPreview}
                                alt="Logo preview"
                                className="h-20 w-auto rounded-xl border border-border bg-background p-2"
                              />
                              <p className="mt-2 text-xs text-muted-foreground">
                                {form.logoFile?.name} •{" "}
                                {(Number(form.logoFile?.size || 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* STEP 5 */}
                    <div className="min-w-full px-3">
                      <div className="h-full overflow-y-auto pr-2 space-y-4">
                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-sm font-medium text-foreground">
                            Account
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-medium">{form.fullName || "-"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Email</span>
                              <span className="font-medium">{form.email || "-"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Username</span>
                              <span className="font-medium">{form.username || "-"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-sm font-medium text-foreground">
                            Brand
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Brand</span>
                              <span className="font-medium">{form.brandName || "-"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Industry</span>
                              <span className="font-medium">{form.industry}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Tone</span>
                              <span className="font-medium">{form.tone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-sm font-medium text-foreground">
                            Content
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Goals</span>
                              <span className="font-medium">{form.goals.join(", ") || "-"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">AI images</span>
                              <span className="font-medium">{form.aiImages ? "Enabled" : "Disabled"}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Frequency</span>
                              <span className="font-medium">{form.frequency}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Post time</span>
                              <span className="font-medium">{form.postScheduleTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <p className="text-sm font-medium text-foreground">
                            Assets
                          </p>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Colors</span>
                              <span className="font-medium">
                                {form.colors.slice(0, form.numColors).join(", ")}
                              </span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-muted-foreground">Logo</span>
                              <span className="font-medium">
                                {form.logoFile ? "Uploaded" : "Not uploaded"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={onSubmitAll}
                          disabled={loading}
                          className={[
                            "w-full rounded-full px-6 py-3 text-sm font-medium shadow-sm transition",
                            loading
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:opacity-90",
                          ].join(" ")}
                        >
                          {loading ? "Creating..." : "Create account"}
                        </button>

                        <p className="text-center text-xs text-muted-foreground">
                          Already have an account?{" "}
                          <a href="/login" className="underline underline-offset-4">
                            Login
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* mobile nav buttons */}
              <div className="mt-6 flex items-center justify-between gap-3 sm:hidden">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 0}
                  className={[
                    "rounded-full border border-border px-4 py-2 text-sm",
                    step === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-muted",
                  ].join(" ")}
                >
                  ← Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!stepValid}
                    className={[
                      "rounded-full px-5 py-2 text-sm font-medium shadow-sm transition",
                      stepValid
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted text-muted-foreground cursor-not-allowed",
                    ].join(" ")}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSubmitAll}
                    disabled={loading}
                    className={[
                      "rounded-full px-5 py-2 text-sm font-medium shadow-sm transition",
                      loading
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90",
                    ].join(" ")}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-muted-foreground">
            By continuing you agree to our terms. Your data is used only to
            generate on-brand content.
          </div>
        </div>

        <SiteFooter />
      </main>
    </>
  );
}