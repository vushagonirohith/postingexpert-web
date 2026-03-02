import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | PostingExpert",
  description:
    "Get in touch with the PostingExpert team at iNikola Technologies. We're here to help with billing, technical support, and general enquiries.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="bg-white">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
              <span aria-hidden>←</span>
              Back to Home
            </Link>
            <span className="text-xs text-neutral-400">PostingExpert by iNikola Technologies</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-500">
            Have a question, issue, or feedback? The iNikola team is happy to help. Reach out and we'll get back to you promptly.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 text-lg">✉</div>
            <h2 className="text-base font-semibold text-neutral-900">General Support</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              For questions about your account, features, and anything else related to PostingExpert.
            </p>
            <a
              href="mailto:postingexpert@inikola.com"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              postingexpert@inikola.com
            </a>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 text-lg">💼</div>
            <h2 className="text-base font-semibold text-neutral-900">Business & Partnerships</h2>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Interested in enterprise plans, agency partnerships, or collaborating with iNikola Technologies?
            </p>
            <a
              href="mailto:postingexpert@inikola.com"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              postingexpert@inikola.com
            </a>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 md:col-span-2">
            <h2 className="text-base font-semibold text-neutral-900 mb-6">What to expect when you write to us</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  icon: "⚡",
                  title: "Fast response",
                  desc: "We aim to reply within 24–48 business hours on all support queries.",
                },
                {
                  icon: "🛠",
                  title: "Technical issues",
                  desc: "Include your registered email and a brief description of the problem for faster resolution.",
                },
                {
                  icon: "💳",
                  title: "Billing queries",
                  desc: "Mention your username and the transaction ID for payment-related questions.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-100 bg-neutral-50 p-5">
                  <div className="text-2xl">{item.icon}</div>
                  <p className="mt-3 text-sm font-semibold text-neutral-800">{item.title}</p>
                  <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company info */}
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
          <p className="font-semibold text-neutral-800">iNikola Technologies</p>
          <p className="mt-1">PostingExpert is a product of iNikola Technologies — building intelligent automation for modern businesses.</p>
          <p className="mt-3">
            <span className="font-medium text-neutral-700">Email:</span>{" "}
            <a href="mailto:postingexpert@inikola.com" className="text-violet-600 underline underline-offset-4">
              postingexpert@inikola.com
            </a>
          </p>
          <p className="mt-1">
            <span className="font-medium text-neutral-700">Website:</span>{" "}
            <a href="https://postingexpert.com" className="text-violet-600 underline underline-offset-4">
              https://postingexpert.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}