import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | PostingExpert",
  description:
    "PostingExpert Privacy Policy describing what data we collect, why we collect it, how it is used, stored, and how users can control or delete their data.",
  alternates: { canonical: "/privacy-policy" },
};

const LAST_UPDATED = "27 January, 2026";

const SECTIONS: Array<[string, string]> = [
  ["info", "1. Information We Collect"],
  ["why", "2. Why We Collect This Data"],
  ["use", "3. How We Use the Data"],
  ["retention", "4. Data Storage & Retention"],
  ["sharing", "5. Data Sharing & Processors"],
  ["control", "6. User Control & Revoking Access"],
  ["deletion", "7. Data Deletion"],
  ["meta", "8. Meta Compliance"],
  ["security", "9. Security Measures"],
  ["changes", "10. Changes to This Policy"],
  ["contact", "11. Contact Information"],
];

export default function PrivacyPolicyPage() {
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

            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600">
              LEGAL
            </span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-neutral-600">
              Last updated: <span className="font-medium">{LAST_UPDATED}</span>
            </p>

            <p className="mt-5 text-base leading-relaxed text-neutral-700">
              PostingExpert (also referred to as “we”, “our”, or “the App”) is
              committed to protecting your privacy and complying with Facebook,
              Instagram, and Meta Platform Policies.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Contact us
              </Link>
              <Link
                href="#deletion"
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Data deletion
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          {/* Mobile: On this page (server-safe) */}
          <div className="mb-8 lg:hidden">
            <details className="rounded-2xl border border-neutral-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                On this page
              </summary>

              <nav className="mt-3 space-y-1.5 text-sm">
                {SECTIONS.map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-2 py-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </details>
          </div>

          <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
            {/* Desktop sticky nav */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs font-semibold tracking-wide text-neutral-700">
                  ON THIS PAGE
                </p>
                <nav className="mt-3 space-y-1.5 text-sm">
                  {SECTIONS.map(([id, label]) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="block rounded-lg px-2 py-2 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
                    >
                      {label}
                    </a>
                  ))}
                </nav>

                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-700">
                    Questions or deletion request? Email{" "}
                    <span className="font-medium">contact@inikola.com</span>.
                  </p>
                </div>
              </div>
            </aside>

            {/* Policy */}
            <article className="min-w-0">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
                <div className="prose prose-neutral max-w-none">
                  <p>
                    This Privacy Policy explains what data we collect, why we
                    collect it, how it is used, how it is stored, and how users
                    can control or delete their data when using our application.
                  </p>

                  <h2 id="info">1. Information We Collect</h2>
                  <p>
                    When you connect your Facebook or Instagram account to
                    PostingExpert, we may collect the following information only
                    after explicit user authorization:
                  </p>

                  <h3>a. Facebook Data</h3>
                  <ul>
                    <li>Facebook Page IDs</li>
                    <li>List of Facebook Pages managed by the user</li>
                    <li>Page names and profile images</li>
                    <li>
                      Page-level engagement metrics (likes, comments, shares,
                      reach)
                    </li>
                    <li>Content posted via our app (images, captions, PDFs)</li>
                  </ul>

                  <h3>b. Instagram Data (Professional Accounts Only)</h3>
                  <ul>
                    <li>Instagram Professional Account ID</li>
                    <li>Instagram username</li>
                    <li>Instagram profile picture</li>
                    <li>
                      Instagram media IDs for content published through our app
                    </li>
                    <li>
                      Engagement metrics (likes, comments, reach, impressions)
                    </li>
                  </ul>

                  <h3>c. Content Data</h3>
                  <ul>
                    <li>User-generated prompts and topics</li>
                    <li>
                      AI-generated images, captions, and educational content
                    </li>
                    <li>
                      Scheduled or published post metadata (timestamps,
                      platform)
                    </li>
                  </ul>

                  <h3>d. Authentication Data</h3>
                  <ul>
                    <li>Access tokens provided by Meta during authorization</li>
                    <li>Token expiration and refresh metadata</li>
                  </ul>

                  <p>
                    <strong>We do NOT collect:</strong>
                  </p>
                  <ul>
                    <li>Facebook personal profile data</li>
                    <li>Private messages (DMs)</li>
                    <li>User passwords</li>
                    <li>Financial information</li>
                  </ul>

                  <h2 id="why">2. Why We Collect This Data</h2>
                  <p>
                    We collect and process this data strictly to provide our
                    core functionality:
                  </p>
                  <ul>
                    <li>
                      To connect and verify Facebook Pages and Instagram
                      Business accounts
                    </li>
                    <li>
                      To publish content (images, captions, educational posts)
                      on behalf of users
                    </li>
                    <li>To display connected accounts inside the dashboard</li>
                    <li>
                      To analyze post performance and show engagement analytics
                    </li>
                    <li>To allow users to manage multiple Pages and accounts</li>
                    <li>
                      To provide automation features explicitly requested by the
                      user
                    </li>
                  </ul>
                  <p>
                    Without these permissions, PostingExpert cannot function as
                    an automated social media marketing platform.
                  </p>

                  <h2 id="use">3. How We Use the Data</h2>
                  <p>
                    Your data is used only within the scope explicitly approved
                    by you, including:
                  </p>
                  <ul>
                    <li>
                      Posting AI-generated content to selected Facebook Pages
                      and Instagram accounts
                    </li>
                    <li>Displaying connected account details inside the app UI</li>
                    <li>Fetching engagement metrics for analytics dashboards</li>
                    <li>Scheduling posts at user-defined times</li>
                    <li>Improving reliability, performance, and user experience</li>
                  </ul>
                  <p>
                    We do not sell, rent, or use your data for advertising or
                    profiling outside the app.
                  </p>

                  <h2 id="retention">4. Data Storage &amp; Retention</h2>
                  <ul>
                    <li>Access tokens are stored securely in encrypted form</li>
                    <li>
                      Tokens are retained only while the account remains
                      connected
                    </li>
                    <li>
                      Tokens are refreshed automatically as required by Meta APIs
                    </li>
                    <li>
                      Post metadata and analytics are stored for reporting
                      purposes
                    </li>
                  </ul>

                  <p>
                    <strong>Retention period:</strong>
                  </p>
                  <ul>
                    <li>
                      Connected account data is retained until the user
                      disconnects the account
                    </li>
                    <li>
                      Analytics data may be retained for up to 12 months unless
                      deleted earlier by the user
                    </li>
                    <li>
                      Logs and system records may be retained for security and
                      audit purposes
                    </li>
                  </ul>

                  <h2 id="sharing">5. Data Sharing &amp; Third-Party Processors</h2>
                  <p>
                    We do not sell or share data with third parties for marketing
                    purposes.
                  </p>
                  <p>
                    Data is processed only by trusted infrastructure providers
                    acting as data processors, including:
                  </p>
                  <ul>
                    <li>
                      <strong>Amazon Web Services (AWS)</strong> (EC2, S3, Lambda,
                      DynamoDB) — used for secure hosting, storage, processing,
                      and automation.
                    </li>
                  </ul>
                  <p>
                    All processors comply with industry-standard security and
                    data protection practices.
                  </p>

                  <h2 id="control">6. User Control &amp; Revoking Access</h2>
                  <p>Users are always in control of their data.</p>
                  <p>You can revoke access at any time by:</p>
                  <ul>
                    <li>Clicking “Disconnect Facebook / Instagram” inside our app</li>
                    <li>Removing PostingExpert from:</li>
                    <ul>
                      <li>Facebook Settings → Apps and Websites</li>
                      <li>Instagram → Settings → Security → Apps and Websites</li>
                    </ul>
                  </ul>
                  <p>Once access is revoked:</p>
                  <ul>
                    <li>Tokens are invalidated</li>
                    <li>No further data is accessed or processed</li>
                  </ul>

                  <h2 id="deletion">7. Data Deletion</h2>
                  <p>Users may request complete deletion of their data at any time.</p>
                  <p>
                    <strong>How to request deletion:</strong>
                  </p>
                  <ul>
                    <li>
                      In-app: Use the “Delete Account / Delete Data” option (if available)
                    </li>
                    <li>
                      Email: Send a request to <strong>contact@inikola.com</strong>
                    </li>
                  </ul>
                  <p><strong>Please include:</strong></p>
                  <ul>
                    <li>Your registered email</li>
                    <li>Connected Facebook Page or Instagram username</li>
                  </ul>
                  <p>We will process deletion requests within 7 business days.</p>

                  <h2 id="meta">8. Compliance with Meta Platform Policies</h2>
                  <p>PostingExpert complies with:</p>
                  <ul>
                    <li>Meta Platform Terms</li>
                    <li>Facebook Developer Policies</li>
                    <li>Instagram Graph API Terms</li>
                  </ul>
                  <p>
                    We access only the data necessary to provide approved
                    functionality and only after user consent.
                  </p>

                  <h2 id="security">9. Security Measures</h2>
                  <p>We implement industry-standard security practices including:</p>
                  <ul>
                    <li>HTTPS encryption</li>
                    <li>Token encryption at rest</li>
                    <li>Limited internal access controls</li>
                    <li>Regular monitoring and logging</li>
                  </ul>

                  <h2 id="changes">10. Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy periodically. Any changes
                    will be posted on this page with an updated revision date.
                  </p>

                  <h2 id="contact">11. Contact Information</h2>
                  <ul>
                    <li>
                      <strong>Company Name:</strong> Inikola Technologies Private Limited
                    </li>
                    <li>
                      <strong>Product:</strong> PostingExpert
                    </li>
                    <li>
                      <strong>Email:</strong> contact@inikola.com
                    </li>
                    <li>
                      <strong>Website:</strong>{" "}
                      <Link
                        href="https://inikola.com"
                        className="no-underline hover:underline"
                      >
                        https://inikola.com
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom cards */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:p-6">
                  <p className="text-sm font-medium text-neutral-900">
                    Need data deletion?
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">
                    Email <span className="font-medium">contact@inikola.com</span>{" "}
                    with your registered email and connected account.
                  </p>
                  <div className="mt-4">
                    <a
                      href="mailto:contact@inikola.com?subject=PostingExpert%20Data%20Deletion%20Request"
                      className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Email deletion request
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
                  <p className="text-sm font-medium text-neutral-900">
                    Back to PostingExpert
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">
                    Return and continue managing your automations.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer strip */}
              <div className="mt-10 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
                <p>
                  © {new Date().getFullYear()} PostingExpert • Inikola Technologies Private Limited
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
