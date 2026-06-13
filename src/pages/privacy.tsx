// pages/privacy.tsx
import { Quicksand } from "next/font/google";
import Link from "next/link";
import Head from "next/head";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Exploree</title>
        <meta
          name="description"
          content="Privacy policy for the Exploree app — learn how we collect, use, and protect your personal data."
        />
      </Head>

      <div
        className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <main className="mx-auto max-w-2xl px-6 py-16 pb-32">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
            Last updated: March 4, 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                1. Introduction
              </h2>
              <p>
                Exploree (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
                respects your privacy. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our application. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                We may collect the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account Information:</strong> When you sign in with
                  Google, we receive your name, email address, and profile
                  picture.
                </li>
                <li>
                  <strong>User Content:</strong> Spots, collections, comments,
                  and other content you create within the app.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you
                  interact with the app, such as pages visited and features
                  used.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                3. How We Use Your Information
              </h2>
              <p className="mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your experience</li>
                <li>
                  Enable social features such as sharing, collections, and
                  comments
                </li>
                <li>
                  Communicate with you about updates or changes to the service
                </li>
                <li>Ensure the security and integrity of the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                4. Sharing of Information
              </h2>
              <p>
                We do not sell your personal information. We may share your
                information only in the following cases:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>With other users:</strong> Your profile, spots, and
                  collections may be visible to other Exploree users.
                </li>
                <li>
                  <strong>Service providers:</strong> We use third-party
                  services (e.g., hosting, analytics) that may process data on
                  our behalf.
                </li>
                <li>
                  <strong>Legal requirements:</strong> If required by law or to
                  protect our rights.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                5. Content Policy
              </h2>
              <p className="mb-3">
                Exploree is a platform for discovering and sharing real places.
                By uploading content, you agree to the following rules:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Relevant content only:</strong> All uploaded photos
                  and descriptions must be directly related to the place or spot
                  being shared. Content that is unrelated, misleading, or does
                  not represent an actual location is not permitted.
                </li>
                <li>
                  <strong>No inappropriate content:</strong> Uploading
                  offensive, explicit, violent, hateful, or otherwise
                  inappropriate images or text is strictly prohibited.
                </li>
                <li>
                  <strong>Respect copyright:</strong> Only upload content that
                  you own or have the right to share.
                </li>
              </ul>
              <p className="mt-3">
                Violation of these rules may result in content removal, account
                suspension, or permanent ban without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                6. Data Storage &amp; Security
              </h2>
              <p>
                Your data is stored in our own MySQL database hosted on an Oracle
                Cloud virtual server. We use industry-standard measures to protect
                it. While we strive to protect your personal information, no method
                of electronic storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                7. Your Rights
              </h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Withdraw consent for data processing at any time</li>
                <li>Request export of your data</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, please contact us at the email address
                provided below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                8. Cookies &amp; Analytics
              </h2>
              <p>
                We only use cookies that are strictly necessary to operate the app
                — primarily the authentication session cookie that keeps you signed
                in. We do not use advertising or third-party analytics cookies. For
                details on what we store and what you accept by using Exploree, see
                our{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cookies &amp; Data page
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any significant changes by posting the new policy
                on this page with an updated date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a
                  href="mailto:support@exploree.app"
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  dejny@dejny.eu
                </a>
                .
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
