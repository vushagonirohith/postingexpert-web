import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | PostingExpert",
  description:
    "PostingExpert refund and cancellation policy by iNikola Technologies. Understand your rights and options for cancelling your subscription or requesting a refund.",
  alternates: { canonical: "/refund-policy" },
};

const LAST_UPDATED = "01 March, 2026";

export default function RefundPolicyPage() {
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
            <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-400">
              Last updated: {LAST_UPDATED}
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-500">
            We want you to be fully confident using PostingExpert. This policy explains your options for cancellations, refunds, and what to expect at every step.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">

        {/* Quick summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
          {[
            {
              icon: "✓",
              bg: "bg-emerald-100",
              text: "text-emerald-700",
              title: "Cancel anytime",
              desc: "No lock-in contracts. Cancel from your Settings page whenever you choose.",
            },
            {
              icon: "📅",
              bg: "bg-blue-100",
              text: "text-blue-700",
              title: "Access until period ends",
              desc: "After cancelling, you retain full access until your current billing period expires.",
            },
            {
              icon: "✉",
              bg: "bg-violet-100",
              text: "text-violet-700",
              title: "Refunds reviewed fairly",
              desc: "Refund requests are assessed case-by-case and responded to within 3 business days.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${c.bg} ${c.text}`}>
                {c.icon}
              </div>
              <p className="text-sm font-semibold text-neutral-900">{c.title}</p>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <article className="space-y-10 text-sm text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Cancellation Policy</h2>
            <p className="mb-4">
              You may cancel your PostingExpert subscription at any time without penalty. To cancel your subscription:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in to your account at <a href="https://postingexpert.com" className="text-violet-600 underline underline-offset-4">postingexpert.com</a></li>
              <li>Navigate to <strong>Settings → Subscription</strong></li>
              <li>Click <strong>"Cancel Subscription"</strong> and confirm</li>
            </ol>
            <p className="mt-4">
              Once cancelled, your subscription will not auto-renew at the next billing cycle. You will
              continue to have uninterrupted access to all features of your plan until the end of your
              current paid period. No partial refunds are issued for remaining days within an active billing period.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Refund Policy</h2>
            <p className="mb-4">
              PostingExpert subscriptions are generally non-refundable given the nature of digital services.
              However, iNikola Technologies reviews every refund request individually and fairly under the
              following conditions:
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-semibold text-emerald-800 mb-2">✓ Circumstances eligible for refund consideration</p>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-emerald-900">
                  <li>A verified technical failure on iNikola's end that prevented you from accessing the service for a significant period.</li>
                  <li>A duplicate or erroneous charge caused by a billing system error.</li>
                  <li>A charge that was processed after a confirmed cancellation.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-semibold text-red-800 mb-2">✗ Circumstances not eligible for a refund</p>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-red-900">
                  <li>Change of mind or no longer needing the service after purchase.</li>
                  <li>Partial use of a subscription period after cancellation.</li>
                  <li>Failure to cancel before an auto-renewal date.</li>
                  <li>Account suspension or termination resulting from a violation of our Terms & Conditions.</li>
                  <li>Dissatisfaction due to third-party platform limitations (e.g. Instagram, LinkedIn API restrictions).</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Free Trials & Promotional Plans</h2>
            <p>
              If you activated your account using a promotional or trial offer, the nominal trial activation
              charge (if any) is non-refundable. No recurring charges are applied during the trial period.
              To avoid being billed for a full subscription, you must cancel before your trial period ends.
              iNikola Technologies will send a reminder email before your trial converts to a paid subscription.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">How to Request a Refund</h2>
            <p className="mb-4">
              To submit a refund request, email us at{" "}
              <a href="mailto:postingexpert@inikola.com" className="text-violet-600 underline underline-offset-4">
                postingexpert@inikola.com
              </a>{" "}
              with the following details:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your registered email address on PostingExpert</li>
              <li>Your PostingExpert username</li>
              <li>A clear description of the reason for your refund request</li>
              <li>Any supporting information — screenshots, transaction ID, or error details</li>
            </ul>
            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
              <p><strong>Response time:</strong> We will acknowledge your request within <strong>3 business days</strong>.</p>
              <p className="mt-1"><strong>Processing time:</strong> Approved refunds are returned to your original payment method within <strong>5–7 business days</strong>.</p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Changes to This Policy</h2>
            <p>
              iNikola Technologies reserves the right to modify this Refund & Cancellation Policy at any
              time. Any changes will be communicated via email or in-app notice and will apply to subscriptions
              renewed after the effective date of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900 mb-3">Contact</h2>
            <p className="mb-3">For any refund or cancellation queries, please reach out to us directly:</p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-xs space-y-1">
              <p className="font-semibold text-neutral-800 text-sm">iNikola Technologies</p>
              <p className="text-neutral-500">PostingExpert is a product of iNikola Technologies.</p>
              <p className="mt-2">
                <span className="font-medium text-neutral-700">Email:</span>{" "}
                <a href="mailto:postingexpert@inikola.com" className="text-violet-600 underline underline-offset-4">
                  postingexpert@inikola.com
                </a>
              </p>
              <p>
                <span className="font-medium text-neutral-700">Website:</span>{" "}
                <a href="https://postingexpert.com" className="text-violet-600 underline underline-offset-4">
                  https://postingexpert.com
                </a>
              </p>
            </div>
          </section>

        </article>
      </div>
    </main>
  );
}