// src/app/settings/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { getToken, clearAuth } from "src/lib/auth";

// ✅ Same gateway as the rest of the app
const API_BASE =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ||
  process.env.NEXT_PUBLIC_LAMBDA_URL ||
  "https://aomkmgl9zj.execute-api.ap-south-1.amazonaws.com/prod";

const BILLING_API = process.env.NEXT_PUBLIC_BILLING_API_URL || "";

const PROFILE_GET_PATH    = "/user/profile";
const PROFILE_UPDATE_PATH = "/user/profile";
const SUBSCRIPTION_STATUS_PATH = "/billing/subscription";

type ProfileData = {
  name?:               string;
  email?:              string;
  username?:           string;
  phone?:              string;
  brand_name?:         string;
  businessType?:       string;
  website?:            string;
  city?:               string;
  tone?:               string;
  goals?:              string;
  frequency?:          string;
  post_schedule_time?: string;
  contact_details?:    string;
  [k: string]:         any;
};



// Helper: unwrap Lambda proxy response and normalise profile shape
function unwrapProfile(raw: any): ProfileData {
  // unwrap Lambda proxy { statusCode, body: "json-string" }
  let data = raw;
  if (data?.body && typeof data.body === "string") {
    try { data = JSON.parse(data.body); } catch {}
  }
  // profile can be at data.user | data.profile | data itself
  const p = data?.user || data?.profile || data || {};
  return {
    name:               p.name              ?? p.full_name ?? "",
    email:              p.email             ?? "",
    username:           p.username          ?? "",
    phone:              p.phone             ?? p.contact_details ?? "",
    brand_name:         p.brand_name        ?? p.business_name ?? p.brandName ?? "",
    businessType:       p.businessType      ?? p.business_type ?? p.industry ?? "",
    website:            p.website           ?? "",
    city:               p.city              ?? "",
    tone:               p.tone              ?? "",
    goals:              p.goals             ?? "",
    frequency:          p.frequency         ?? p.posting_frequency ?? "",
    post_schedule_time: p.post_schedule_time ?? p.scheduled_time ?? "",
    contact_details:    p.contact_details   ?? "",
  };
}

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function fmtDate(d?: string | number | null) {
  if (!d) return "—";
  try {
    const dt = typeof d === "number" ? new Date(d * 1000) : new Date(Number(d) * 1000);
    return dt.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

/* ─────────────────────────────────────────────────────────────── */
/* Field — module level to prevent re-mount on every keystroke    */
/* ─────────────────────────────────────────────────────────────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  multiline,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}) {
  const base =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/25";
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={cn(base, disabled && "opacity-60")}
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(base, disabled && "opacity-60")}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* DeleteDataCard                                                  */
/* ─────────────────────────────────────────────────────────────── */

function DeleteDataCard() {
  const router = useRouter();

  const onDelete = async () => {
    const ok = window.confirm(
      "Are you sure? This will delete ALL your PostingExpert data. This cannot be undone."
    );
    if (!ok) return;

    try {
      const token = getToken();
      if (!token) {
        alert("You are not logged in.");
        router.push("/login");
        return;
      }

      if (!API_BASE) {
        alert("NEXT_PUBLIC_API_BASE_URL is not set. Add it in your .env and restart dev server.");
        return;
      }

      const res = await fetch(`${API_BASE}/user/delete_all_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Failed to delete data");
        return;
      }

      clearAuth();
      alert("Your data has been deleted successfully.");
      router.push("/login");
    } catch (err: any) {
      alert(err?.message || "Something went wrong.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-base font-semibold text-foreground">Danger zone</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Delete your entire PostingExpert data. This is irreversible.
      </p>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900">
          This will delete: your user profile, survey/preferences data, and your
          connected social accounts.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-red-800">You will be logged out after deletion.</p>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete all my data
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Types                                                           */
/* ─────────────────────────────────────────────────────────────── */



type SubscriptionData = {
  status?: "active" | "inactive" | "canceled" | "past_due" | "trial" | "expired" | string;
  plan_name?: string;
  plan_key?: string;
  started_at?: string | number;
  current_period_end?: string | number;
  amount_inr?: number;
  per_month_inr?: number;
  renewal?: boolean;
  trial_days?: number | string;
  trial_ends_at?: string | number;
  is_trial?: boolean;
  discount_pct?: number;
  promo_code?: string;
};

/* ─────────────────────────────────────────────────────────────── */
/* Profile Card                                                    */
/* ─────────────────────────────────────────────────────────────── */

function ProfileCard({
  loggedIn,
  hydrated,
}: {
  loggedIn: boolean;
  hydrated: boolean;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [edit,    setEdit]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [data,    setData]    = useState<ProfileData>({});
  const [draft,   setDraft]   = useState<ProfileData>({});
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const editingRef = useRef(false);
  useEffect(() => {
    editingRef.current = edit;
  }, [edit]);

  const fetchProfile = async () => {
    setLoading(true);
    setMsg(null);

    try {
      if (!API_BASE) {
        setMsg({ type: "err", text: "NEXT_PUBLIC_API_BASE_URL is not set in env." });
        setLoading(false);
        return;
      }

      const token = getToken();
      if (!token) {
        setLoading(false);
        setData({});
        setDraft({});
        return;
      }

      const res  = await fetch(`${API_BASE}${PROFILE_GET_PATH}`, {
        method:  "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: json?.error || "Failed to fetch profile" });
        setLoading(false);
        return;
      }

      const profile = unwrapProfile(json);
      setData(profile);
      if (!editingRef.current) setDraft(profile);
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Failed to fetch profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const onSave = async () => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (!API_BASE) {
      setMsg({ type: "err", text: "NEXT_PUBLIC_API_BASE_URL is not set in env." });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const res  = await fetch(`${API_BASE}${PROFILE_UPDATE_PATH}`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: {
            name:               draft.name,
            phone:              draft.phone,
            brand_name:         draft.brand_name,
            businessType:       draft.businessType,
            website:            draft.website,
            city:               draft.city,
            tone:               draft.tone,
            goals:              draft.goals,
            frequency:          draft.frequency,
            post_schedule_time: draft.post_schedule_time,
          }
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: json?.error || "Failed to update profile" });
        setSaving(false);
        return;
      }

      const updated = unwrapProfile(json);
      // merge — keep email/username from original data (read-only)
      const merged = { ...draft, ...updated, email: data.email, username: data.username };
      setData(merged);
      setDraft(merged);
      setEdit(false);
      setMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setDraft(data);
    setEdit(false);
    setMsg(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your user profile, business details, and survey/preferences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {edit ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!loggedIn) { router.push("/login"); return; }
                setDraft(data);
                setEdit(true);
              }}
              className={cn(
                "rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted",
                !loggedIn && "opacity-70"
              )}
            >
              {loggedIn ? "Edit profile" : "Login to edit"}
            </button>
          )}
        </div>
      </div>

      {!loggedIn && (
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Please login to edit your profile and subscription.
          </p>
        </div>
      )}

      {msg && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4 text-sm",
            msg.type === "ok"
              ? "border-primary/25 bg-primary/10"
              : "border-destructive/25 bg-destructive/10"
          )}
        >
          {msg.text}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* User */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">User profile</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="Full name"
              value={edit ? draft.name : data.name}
              onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
              placeholder="Your name"
              disabled={!edit}
            />
            <Field
              label="Email"
              value={data.email || draft.email}
              placeholder="Email"
              disabled={true}
            />
            <Field
              label="Phone"
              value={edit ? draft.phone : data.phone}
              onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
              placeholder="+91 XXXXX XXXXX"
              disabled={!edit}
            />
          </div>
        </div>

        {/* Business */}
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">Business details</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="Brand name"
              value={edit ? draft.brand_name : data.brand_name}
              onChange={(v) => setDraft((d) => ({ ...d, brand_name: v }))}
              placeholder="Your brand/company"
              disabled={!edit}
            />
            <Field
              label="Industry / Business type"
              value={edit ? draft.businessType : data.businessType}
              onChange={(v) => setDraft((d) => ({ ...d, businessType: v }))}
              placeholder="E.g. EdTech, SaaS, Agency"
              disabled={!edit}
            />
            <Field
              label="Brand tone"
              value={edit ? draft.tone : data.tone}
              onChange={(v) => setDraft((d) => ({ ...d, tone: v }))}
              placeholder="E.g. professional, friendly, bold"
              disabled={!edit}
            />
            <Field
              label="Website"
              value={edit ? draft.website : data.website}
              onChange={(v) => setDraft((d) => ({ ...d, website: v }))}
              placeholder="https://"
              disabled={!edit}
            />
          </div>
        </div>

        {/* Survey / Preferences */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">Survey & preferences</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Contact details"
              value={edit ? draft.contact_details : data.contact_details}
              onChange={(v) => setDraft((d) => ({ ...d, contact_details: v }))}
              placeholder="Phone / WhatsApp / contact info"
              disabled={!edit}
              multiline
            />
            <Field
              label="Goals"
              value={edit ? draft.goals : data.goals}
              onChange={(v) => setDraft((d) => ({ ...d, goals: v }))}
              placeholder="E.g. leads, awareness, growth"
              disabled={!edit}
              multiline
            />
            <Field
              label="Post frequency"
              value={edit ? draft.frequency : data.frequency}
              onChange={(v) => setDraft((d) => ({ ...d, frequency: v }))}
              placeholder="E.g. 3x/week"
              disabled={!edit}
            />
            <Field
              label="Post schedule time"
              value={edit ? draft.post_schedule_time : data.post_schedule_time}
              onChange={(v) => setDraft((d) => ({ ...d, post_schedule_time: v }))}
              placeholder="E.g. 10:00 AM"
              disabled={!edit}
            />
          </div>
        </div>
      </div>

      {hydrated && loggedIn && loading && (
        <p className="mt-6 text-xs text-muted-foreground">Loading profile...</p>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Subscription Card                                               */
/* ─────────────────────────────────────────────────────────────── */

function SubscriptionCard({
  loggedIn,
  hydrated,
  paymentSuccess,
}: {
  loggedIn:       boolean;
  hydrated:       boolean;
  paymentSuccess: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sub,     setSub]     = useState<SubscriptionData>({});
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Show payment success banner when redirected from pricing page
  useEffect(() => {
    if (paymentSuccess) {
      setMsg({ type: "ok", text: "🎉 Payment successful! Your subscription is now active." });
      window.history.replaceState({}, "", "/settings");
    }
  }, [paymentSuccess]);

  const badge = useMemo(() => {
    const s      = (sub.status || "inactive").toLowerCase();
    const common = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
    if (s === "active")
      return <span className={cn(common, "bg-emerald-100 text-emerald-800")}>Active</span>;
    if (s === "trial")
      return <span className={cn(common, "bg-blue-100 text-blue-800")}>Free Trial</span>;
    if (s === "past_due")
      return <span className={cn(common, "bg-amber-100 text-amber-900")}>Past due</span>;
    if (s === "canceled")
      return <span className={cn(common, "bg-zinc-200 text-zinc-800")}>Canceled</span>;
    if (s === "expired")
      return <span className={cn(common, "bg-zinc-200 text-zinc-800")}>Expired</span>;
    return <span className={cn(common, "bg-red-100 text-red-800")}>Inactive</span>;
  }, [sub.status]);

  const fetchSubscription = async () => {
    setLoading(true);
    if (!API_BASE) { setLoading(false); return; }
    const token = getToken();
    if (!token)   { setLoading(false); return; }

    try {
      // Use billing API if configured, fallback to main gateway
      const subBase = BILLING_API || API_BASE;
      const res  = await fetch(`${subBase}${SUBSCRIPTION_STATUS_PATH}`, {
        method:  "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      let json = await res.json().catch(() => ({}));
      // unwrap Lambda proxy
      if (json?.body && typeof json.body === "string") {
        try { json = JSON.parse(json.body); } catch {}
      }
      if (!res.ok) {
        setMsg({ type: "err", text: json?.error || "Failed to fetch subscription" });
        return;
      }
      const subscription = (json?.subscription ?? json?.data ?? json) as SubscriptionData;
      setSub(subscription || {});
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Failed to fetch subscription" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Subscription</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your subscription status and manage payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {badge}
          <button
            type="button"
            onClick={() => {
              if (!loggedIn) { router.push("/login"); return; }
              router.push("/pricing");
            }}
            className={cn(
              "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90",
              !loggedIn && "opacity-70"
            )}
          >
            {!loggedIn ? "Login to manage" : "Make payment"}
          </button>
        </div>
      </div>

      {/* Success / error message */}
      {msg && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4 text-sm",
            msg.type === "ok"
              ? "border-primary/25 bg-primary/10"
              : "border-destructive/25 bg-destructive/10"
          )}
        >
          {msg.text}
        </div>
      )}

      {/* Free trial banner */}
      {sub.status === "trial" && sub.trial_ends_at && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          🎁 Free trial active — ends on{" "}
          <strong>{fmtDate(Number(sub.trial_ends_at))}</strong>.
          Your plan starts automatically after that.
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">Plan</p>
          <p className="mt-2 text-sm font-semibold">{sub.plan_name || "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sub.amount_inr
              ? `₹${sub.amount_inr.toLocaleString("en-IN")} total`
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">Started</p>
          <p className="mt-2 text-sm font-semibold">{fmtDate(sub.started_at)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {sub.trial_days && Number(sub.trial_days) > 0
              ? `${sub.trial_days}-day free trial`
              : "No trial"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">Valid till</p>
          <p className="mt-2 text-sm font-semibold">
            {fmtDate(sub.current_period_end)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Status: {sub.status || "inactive"}
          </p>
        </div>
      </div>

      {hydrated && loggedIn && loading && (
        <p className="mt-6 text-xs text-muted-foreground">Loading subscription...</p>
      )}

      {!loggedIn && (
        <p className="mt-5 text-xs text-muted-foreground">
          Login is required to view or manage subscription.
        </p>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Settings Page                                                   */
/* ─────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const searchParams   = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";

  const [hydrated,  setHydrated]  = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);

  useEffect(() => {
    setHydrated(true);
    setLoggedIn(!!getToken());
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, subscription, and account data.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
        >
          ← Back
        </Link>
      </div>

      <div className="space-y-6">
        <ProfileCard loggedIn={loggedIn} hydrated={hydrated} />
        <SubscriptionCard
          loggedIn={loggedIn}
          hydrated={hydrated}
          paymentSuccess={paymentSuccess}
        />
        <DeleteDataCard />
      </div>
    </main>
  );
}