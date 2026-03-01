"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "✦", title: "AI Content Studio", from: "studio" },
  { icon: "⬡", title: "Connect & Automate", from: "connect" },
  { icon: "◈", title: "Social Analytics", from: "analytics" },
  { icon: "▣", title: "Content Gallery", from: "gallery" },
];

const PLANS = [
  { id: "starter_3m", label: "3 Months", price: "₹7,999/mo" },
  { id: "pro_6m", label: "6 Months", price: "₹5,999/mo" },
  { id: "annual_12m", label: "12 Months", price: "₹4,999/mo" },
];

const FROM_LABELS: Record<string, string> = {
  studio: "AI Content Studio",
  connect: "Connect & Automate",
  analytics: "LinkedIn Analytics",
  gallery: "Content Gallery",
};

export function PaywallOverlay({ from = "" }) {
  const router = useRouter();
  const [plan, setPlan] = useState("pro_6m");

  const featureLabel = FROM_LABELS[from] || "this feature";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* LIGHT OVERLAY */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md" />

      <div className="relative w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-xl">

        <div className="px-8 py-8">

          {/* Heading */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold">
              Unlock <span className="text-purple-600">{featureLabel}</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Access all features with a simple subscription
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            {FEATURES.map((f) => {
              const active = f.from === from;
              return (
                <div
                  key={f.from}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    active
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {f.title}
                </div>
              );
            })}
          </div>

          {/* Plans */}
          <div className="mt-8 space-y-2">
            {PLANS.map((p) => {
              const selected = plan === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                    selected
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className={`text-sm font-semibold ${selected ? "text-purple-600" : ""}`}>
                    {p.price}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => router.push(`/pricing?plan=${plan}`)}
              className="w-full rounded-xl bg-purple-600 text-white py-3 text-sm font-medium hover:bg-purple-700"
            >
              Continue →
            </button>

            <button
              onClick={() => router.push("/pricing")}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm hover:bg-gray-50"
            >
              View pricing
            </button>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Secure payment • Instant access • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}