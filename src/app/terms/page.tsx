import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | PostingExpert",
  description:
    "Terms and Conditions for using PostingExpert, an AI-powered social media automation platform by iNikola Technologies.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "01 March, 2026";

const SECTIONS = [
  { id: "acceptance",   title: "1. Acceptance of Terms" },
  { id: "service",      title: "2. Description of Service" },
  { id: "account",      title: "3. Account Registration" },
  { id: "subscription", title: "4. Subscription & Payments" },
  { id: "use",          title: "5. Acceptable Use" },
  { id: "ip",           title: "6. Intellectual Property" },
  { id: "data",         title: "7. Data & Privacy" },
  { id: "termination",  title: "8. Termination" },
  { id: "liability",    title: "9. Limitation of Liability" },
  { id: "governing",    title: "10. Governing Law" },
  { id: "contact",      title: "11. Contact" },
];

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="mt-3 max-w-xl text-base text-neutral-500">
            Please read these terms carefully before using PostingExpert. By accessing our service, you agree to be bound by these terms.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16 md:flex md:gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">Contents</p>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block rounded-lg px-3 py-1.5 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Body */}
        <article className="flex-1 space-y-10 text-sm text-neutral-700 leading-relaxed">

          <section id="acceptance">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using PostingExpert (a product operated by <strong>iNikola Technologies</strong>),
              you agree to these Terms & Conditions in full. If you do not agree, please do not use our service.
              iNikola Technologies reserves the right to update these terms at any time, and changes will be
              communicated via email or in-app notification with at least 7 days' notice.
            </p>
          </section>

          <section id="service">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">2. Description of Service</h2>
            <p>
              PostingExpert is an AI-powered social media automation platform built by iNikola Technologies.
              It enables users to generate content, schedule and publish posts, manage multiple social media
              accounts (Instagram, LinkedIn, Facebook), track performance analytics, and manage brand assets —
              all from a single unified dashboard.
            </p>
          </section>

          <section id="account">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">3. Account Registration</h2>
            <p className="mb-3">When registering for PostingExpert, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate, current, and complete information during sign-up.</li>
              <li>Maintain the security of your password and accept responsibility for all activity under your account.</li>
              <li>Notify iNikola Technologies immediately of any unauthorised use of your account.</li>
              <li>Be at least 18 years of age or have parental/guardian consent to use the service.</li>
            </ul>
            <p className="mt-3">
              iNikola Technologies reserves the right to suspend or permanently terminate accounts that
              provide false information or violate these terms.
            </p>
          </section>

          <section id="subscription">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">4. Subscription & Payments</h2>
            <p className="mb-3">PostingExpert operates on a paid subscription model. The following terms apply:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Subscriptions are billed in advance for the selected plan period (3, 6, or 12 months).</li>
              <li>All payments are securely processed via <strong>Razorpay</strong>. Prices are denominated in Indian Rupees (INR) and are inclusive of applicable taxes.</li>
              <li>Subscriptions auto-renew at the end of each billing period unless cancelled before the renewal date.</li>
              <li>Promotional codes and free trial offers are subject to availability and may not be combined with other offers.</li>
              <li>iNikola Technologies reserves the right to revise pricing with a minimum of 30 days' prior notice.</li>
            </ul>
          </section>

          <section id="use">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">5. Acceptable Use</h2>
            <p className="mb-3">By using PostingExpert, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Post, schedule, or distribute content that is illegal, defamatory, harassing, or infringes third-party rights.</li>
              <li>Use the platform to spam, phish, or engage in deceptive or misleading practices on any connected social media platform.</li>
              <li>Violate the terms of service of Instagram, LinkedIn, Facebook, or any other platform connected through PostingExpert.</li>
              <li>Attempt to reverse-engineer, decompile, or disrupt the operation of our platform or underlying infrastructure.</li>
              <li>Share your account credentials with others or resell access to PostingExpert.</li>
              <li>Use the service for any purpose that violates applicable Indian or international laws.</li>
            </ul>
          </section>

          <section id="ip">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">6. Intellectual Property</h2>
            <p className="mb-3">
              Content you generate using PostingExpert's AI tools belongs entirely to you. You retain full
              ownership of all posts, captions, and creative content produced through the platform.
            </p>
            <p>
              PostingExpert's software, branding, design, algorithms, and underlying technology remain the
              exclusive intellectual property of iNikola Technologies. You may not copy, reproduce, resell,
              or distribute our platform or any part of it without prior written permission from iNikola Technologies.
            </p>
          </section>

          <section id="data">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">7. Data & Privacy</h2>
            <p>
              Your use of PostingExpert is also governed by our{" "}
              <Link href="/privacy-policy" className="text-violet-600 underline underline-offset-4">
                Privacy Policy
              </Link>
              , which describes in detail what data we collect, why we collect it, and how it is processed
              and stored. By using our service, you consent to this data processing. iNikola Technologies
              does not sell your personal data to any third party.
            </p>
          </section>

          <section id="termination">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">8. Termination</h2>
            <p className="mb-3">
              You may cancel your subscription at any time from <strong>Settings → Subscription</strong>.
              Upon cancellation, your access continues until the end of your current billing period.
            </p>
            <p>
              iNikola Technologies may suspend or permanently terminate your access without refund if you
              are found to be in material breach of these Terms & Conditions. Upon termination, your account
              data is retained for 30 days and then permanently deleted, unless you request earlier deletion.
            </p>
          </section>

          <section id="liability">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              PostingExpert is provided on an "as is" and "as available" basis without warranties of any kind,
              either express or implied, including but not limited to warranties of merchantability, fitness
              for a particular purpose, or non-infringement.
            </p>
            <p>
              iNikola Technologies shall not be liable for any indirect, incidental, special, or consequential
              damages arising from your use of or inability to use the service. Our total aggregate liability
              to you shall not exceed the total amount you paid to us in the three months immediately preceding
              the claim.
            </p>
          </section>

          <section id="governing">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">10. Governing Law</h2>
            <p>
              These Terms & Conditions are governed by and construed in accordance with the laws of India.
              Any disputes arising out of or in connection with these terms shall be subject to the exclusive
              jurisdiction of the competent courts in Hyderabad, Telangana, India.
            </p>
          </section>

          <section id="contact">
            <h2 className="text-base font-semibold text-neutral-900 mb-3">11. Contact</h2>
            <p className="mb-3">
              If you have any questions or concerns about these Terms & Conditions, please contact us:
            </p>
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