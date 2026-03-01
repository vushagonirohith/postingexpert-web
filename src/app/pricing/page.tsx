// src/app/pricing/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteNavbar } from "@/components/site-navbar";
import { CTA } from "@/components/cta";
import { CoreFeatures } from "@/components/core-features";
import { HowItWorks } from "@/components/how-it-works";

import { getToken } from "@/lib/auth";

const BILLING_API = process.env.NEXT_PUBLIC_BILLING_API_URL || "";

type PlanId = "starter_3m" | "pro_6m" | "annual_12m";

type Plan = {
  id:         PlanId;
  months:     number;
  perMonth:   number;
  totalInr:   number;
  label:      string;
  note:       string;
  highlight?: boolean;
};

type PromoResult = {
  valid:          boolean;
  description?:   string;
  trial_days:     number;
  discount_pct:   number;
  original_paise: number;
  final_paise:    number;
  savings_paise:  number;
  is_trial:       boolean;
  is_bypass:      boolean;   // ← true for ROHITH — skips Razorpay entirely
  force_plan?:    string | null;
  error?:         string;
};

const PLANS: Plan[] = [
  {
    id:       "starter_3m",
    months:   3,
    perMonth: 7999,
    totalInr: 7999 * 3,
    label:    "3 Months",
    note:     "Best to test full workflow & results quickly.",
  },
  {
    id:        "pro_6m",
    months:    6,
    perMonth:  5999,
    totalInr:  5999 * 6,
    label:     "6 Months",
    note:      "Best value for consistent growth & learning.",
    highlight: true,
  },
  {
    id:       "annual_12m",
    months:   12,
    perMonth: 4999,
    totalInr: 4999 * 12,
    label:    "12 Months",
    note:     "Best for long-term content engine & brand momentum.",
  },
];

function inr(paise: number) {
  return (paise / 100).toLocaleString("en-IN");
}
function fmt(amount: number) {
  return amount.toLocaleString("en-IN");
}

function getUserInfo() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.username || "",
      email:  payload.email    || "",
      name:   payload.name     || "",
    };
  } catch {
    return null;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const router = useRouter();
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [selectedId, setSelectedId] = useState<PlanId>("pro_6m");
  const [code,       setCode]       = useState("");
  const [promo,      setPromo]      = useState<PromoResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [paying,     setPaying]     = useState(false);
  const [msg,        setMsg]        = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { setLoggedIn(!!getToken()); }, []);

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedId) ?? PLANS[1],
    [selectedId]
  );

  const pricing = useMemo(() => {
    const originalPaise = selectedPlan.totalInr * 100;
    const discountPct   = promo?.discount_pct ?? 0;
    const finalPaise    = promo?.final_paise  ?? originalPaise;
    const savingsPaise  = originalPaise - finalPaise;
    const trialDays     = promo?.trial_days   ?? 0;
    const isBypass      = promo?.is_bypass    ?? false;
    return { originalPaise, discountPct, finalPaise, savingsPaise, trialDays, isBypass };
  }, [selectedPlan, promo]);

  // ── Validate promo ───────────────────────────
  const validatePromo = async () => {
    const raw = code.trim().toUpperCase();
    if (!raw) { setMsg({ type: "err", text: "Please enter a promo code." }); return; }
    if (!loggedIn) { setMsg({ type: "err", text: "Please login to apply a code." }); router.push("/login"); return; }
    if (!BILLING_API) { setMsg({ type: "err", text: "Billing API URL not configured." }); return; }

    setValidating(true);
    setMsg(null);
    try {
      const res  = await fetch(`${BILLING_API}/billing/validate-promo`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ promoCode: raw, planId: selectedId }),
      });
      const data = await res.json();

      if (!data.ok || !data.valid) {
        setPromo(null);
        setMsg({ type: "err", text: data.error || "Invalid promo code." });
        return;
      }

      // If promo forces a specific plan, auto-select it
      if (data.force_plan && PLANS.find((p) => p.id === data.force_plan)) {
        setSelectedId(data.force_plan as PlanId);
      }

      setPromo(data as PromoResult);

      if (data.is_bypass) {
        // ROHITH type — no payment needed at all
        setMsg({ type: "ok", text: `✓ ${data.description} — Click "Activate Free Access" to continue. No payment needed!` });
      } else if (data.is_trial) {
        setMsg({ type: "ok", text: `✓ ${data.description} — ₹1 charged now, plan starts after trial.` });
      } else {
        setMsg({ type: "ok", text: `✓ ${data.description} — saving ₹${inr(data.savings_paise)}` });
      }
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Failed to validate promo code." });
    } finally {
      setValidating(false);
    }
  };

  const removePromo = () => { setPromo(null); setCode(""); setMsg(null); };

  // ── Checkout ─────────────────────────────────
  const continueCheckout = async () => {
    if (!loggedIn) { setMsg({ type: "err", text: "Please login to continue." }); router.push("/login"); return; }
    if (!BILLING_API) { setMsg({ type: "err", text: "Billing API URL not configured." }); return; }

    const user = getUserInfo();
    if (!user?.userId) { setMsg({ type: "err", text: "Could not read user info. Please re-login." }); router.push("/login"); return; }

    setPaying(true);
    setMsg(null);

    // ── BYPASS FLOW (ROHITH code) — no Razorpay ─
    if (promo?.is_bypass) {
      try {
        const res  = await fetch(`${BILLING_API}/billing/activate-bypass`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            userId:    user.userId,
            promoCode: code.trim().toUpperCase(),
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          setMsg({ type: "err", text: data.error || "Failed to activate free access." });
          setPaying(false);
          return;
        }
        // ✅ Success — redirect to settings
        router.push("/settings?payment=success");
      } catch (e: any) {
        setMsg({ type: "err", text: e?.message || "Something went wrong." });
        setPaying(false);
      }
      return;
    }

    // ── NORMAL RAZORPAY FLOW ─────────────────────
    try {
      const createRes = await fetch(`${BILLING_API}/billing/razorpay/create-subscription`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          planId:        selectedId,
          userId:        user.userId,
          customerEmail: user.email,
          customerName:  user.name,
          promoCode:     promo ? code.trim().toUpperCase() : "",
        }),
      });

      const createData = await createRes.json();
      if (!createData.ok) {
        setMsg({ type: "err", text: createData.error || "Failed to create subscription." });
        setPaying(false);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        setMsg({ type: "err", text: "Failed to load Razorpay. Check your internet connection." });
        setPaying(false);
        return;
      }

      const rzOptions = {
        key:             createData.razorpay_key_id,
        subscription_id: createData.subscription_id,
        name:            "PostingExpert",
        description:     `${selectedPlan.label} Subscription${createData.is_trial ? " (Free Trial)" : ""}`,
        prefill:         { name: user.name, email: user.email },
        theme:           { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setMsg({ type: "err", text: "Payment cancelled. You can try again." });
          },
        },
        handler: async (rzResponse: any) => {
          try {
            const verifyRes = await fetch(`${BILLING_API}/billing/razorpay/verify`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                userId:                   user.userId,
                razorpay_payment_id:      rzResponse.razorpay_payment_id,
                razorpay_subscription_id: rzResponse.razorpay_subscription_id,
                razorpay_signature:       rzResponse.razorpay_signature,
                planId:                   selectedId,
                promoCode:                promo ? code.trim().toUpperCase() : "",
                trialDays:                createData.trial_days ?? 0,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.ok) {
              setMsg({ type: "err", text: verifyData.error || "Payment verification failed. Contact support." });
              setPaying(false);
              return;
            }
            router.push("/settings?payment=success");
          } catch (e: any) {
            setMsg({ type: "err", text: e?.message || "Verification failed. Contact support." });
            setPaying(false);
          }
        },
      };

      const rzInstance = new (window as any).Razorpay(rzOptions);
      rzInstance.on("payment.failed", (err: any) => {
        setMsg({ type: "err", text: `Payment failed: ${err?.error?.description || "Unknown error"}` });
        setPaying(false);
      });
      rzInstance.open();

    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Something went wrong. Please try again." });
      setPaying(false);
    }
  };

  // ── Button label ─────────────────────────────
  const buttonLabel = useMemo(() => {
    if (paying) return null; // spinner shown instead
    if (!loggedIn) return "Login to Continue";
    if (pricing.isBypass) return "Activate Free Access";
    if (pricing.trialDays > 0) return "Start Free Trial";
    return "Pay Now";
  }, [paying, loggedIn, pricing]);

  return (
    <>
      <SiteNavbar />

      <main className="min-h-screen bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute top-40 left-10 h-64 w-64 rounded-full bg-secondary/35 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        </div>

        {/* Header */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <p className="text-sm text-muted-foreground">Pricing</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Pick your package. Save more as you go longer.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Choose a duration that fits your content goals. Designed for consistent posting and measurable growth.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Who it's for</p>
                <p className="mt-2 text-sm font-medium">Founders, creators, and teams who want consistent output</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">What you get</p>
                <p className="mt-2 text-sm font-medium">Content ideas + captions + scheduling + performance learning</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">Secure payments</p>
                <p className="mt-2 text-sm font-medium">Powered by Razorpay. Your data is safe and encrypted.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Left */}
              <div className="lg:col-span-2 space-y-6">

                {/* Plan cards */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Per-month price reduces on longer plans.</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{loggedIn ? "Logged in ✓" : "Not logged in"}</p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {PLANS.map((p) => {
                      const active = p.id === selectedId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSelectedId(p.id); setPromo(null); setCode(""); setMsg(null); }}
                          className={[
                            "relative text-left rounded-3xl border bg-background p-5 transition",
                            active ? "border-primary ring-2 ring-primary/25" : "border-border hover:bg-muted",
                          ].join(" ")}
                        >
                          {p.highlight && !active && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                              Popular
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold">{p.label}</p>
                            {active && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Selected</span>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
                          <div className="mt-4">
                            <p className="text-2xl font-bold tracking-tight">
                              ₹{fmt(p.perMonth)}
                              <span className="text-sm font-normal text-muted-foreground"> /mo</span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">₹{fmt(p.totalInr)} total · {p.months} months</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Promo */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold tracking-tight">Promo / Discount code</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Have a code? Apply it before continuing.</p>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !promo && validatePromo()}
                      placeholder="Enter code "
                      disabled={!!promo}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                    />
                    {promo ? (
                      <button type="button" onClick={removePromo}
                        className="shrink-0 rounded-2xl border border-border bg-background px-6 py-3 text-sm font-medium transition hover:bg-muted">
                        Remove
                      </button>
                    ) : (
                      <button type="button" onClick={validatePromo} disabled={validating || !code.trim()}
                        className="shrink-0 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                        {validating ? "Checking..." : "Apply"}
                      </button>
                    )}
                  </div>

                  {!loggedIn && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Please <Link href="/login" className="underline">login</Link> to apply a code.
                    </p>
                  )}

                  {msg && (
                    <div className={[
                      "mt-4 rounded-2xl border p-4 text-sm",
                      msg.type === "ok" ? "border-primary/30 bg-primary/10" : "border-destructive/30 bg-destructive/10",
                    ].join(" ")}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Order summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold tracking-tight">Order summary</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Review before paying.</p>

                  <div className="mt-5 rounded-2xl border border-border bg-background p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{selectedPlan.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">₹{fmt(selectedPlan.perMonth)}/mo · {selectedPlan.months} months</p>
                      </div>
                      <p className="text-sm font-semibold">₹{fmt(selectedPlan.totalInr)}</p>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{inr(pricing.originalPaise)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount</span>
                        <span>{pricing.discountPct > 0 ? `− ₹${inr(pricing.savingsPaise)} (${pricing.discountPct}%)` : "—"}</span>
                      </div>
                      {pricing.trialDays > 0 && (
                        <div className="flex justify-between text-emerald-600 text-xs font-medium">
                          <span>Free trial</span>
                          <span>{pricing.trialDays} days</span>
                        </div>
                      )}
                      <div className="h-px bg-border" />
                      <div className="flex justify-between font-semibold text-base">
                        <span>{pricing.isBypass ? "Due today" : pricing.trialDays > 0 ? "Due today" : "Total"}</span>
                        <span>
                          {pricing.isBypass
                            ? "₹0"
                            : pricing.trialDays > 0
                            ? "₹1"
                            : `₹${inr(pricing.finalPaise)}`}
                        </span>
                      </div>
                      {pricing.isBypass && (
                        <p className="text-xs text-emerald-600 font-medium">
                          🎉 Free access — no payment required!
                        </p>
                      )}
                      {!pricing.isBypass && pricing.trialDays > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ₹{inr(pricing.finalPaise)} charged after {pricing.trialDays}-day trial
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={continueCheckout}
                    disabled={paying}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  >
                    {paying ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Processing...
                      </>
                    ) : buttonLabel}
                  </button>

                  {loggedIn ? (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {pricing.isBypass ? "✓ No payment required" : "Secure payment via Razorpay 🔒"}
                    </p>
                  ) : (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      <Link href="/login" className="underline">Login</Link> required to continue.
                    </p>
                  )}

                  <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">
                      Need help?{" "}
                      <Link href="/how-it-works" className="underline">See how it works</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16"><CoreFeatures /></div>
            <div className="mt-10"><HowItWorks /></div>
          </div>
        </section>

        <CTA />
      </main>
    </>
  );
}