// pages/cookies.tsx
import { Quicksand } from "next/font/google";
import Link from "next/link";
import Head from "next/head";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function CookiesPage() {
  return (
    <>
      <Head>
        <title>Cookies — Exploree</title>
        <meta
          name="description"
          content="What cookies and data Exploree stores, and what you accept by using the app."
        />
      </Head>

      <div
        className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <main className="mx-auto max-w-2xl px-6 py-16 pb-32">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-bold mb-2">Cookies &amp; Data</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
            Last updated: June 13, 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Using Exploree means accepting these cookies
              </h2>
              <p>
                Exploree only uses cookies that are strictly necessary to run the
                app. There is no tracking, advertising, or third-party analytics
                cookie. Because every cookie we set is essential, there is no
                opt-out: by signing in and using Exploree you accept the cookies
                described below. If you do not want to accept them, please do not
                use the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Cookies we set
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Authentication session:</strong> A secure session cookie
                  managed by NextAuth keeps you signed in. Without it you could not
                  stay logged in.
                </li>
                <li>
                  <strong>Theme preference:</strong> Your light/dark choice is kept
                  in your browser&apos;s local storage so the app remembers it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Where your data is stored
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Our database:</strong> Your account, spots, collections,
                  comments and related content are stored in our own MySQL database
                  hosted on an Oracle Cloud virtual server.
                </li>
                <li>
                  <strong>Google sign-in:</strong> We use Google as the sign-in
                  provider. When you sign in, Google processes your authentication
                  and shares your name, email and profile picture with us. Google&apos;s
                  own cookies and policies apply during that sign-in.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Your choices
              </h2>
              <p>
                You can withdraw consent at any time by signing out and requesting
                deletion of your account, which removes your data from our database.
                For the full picture of how we handle your information, see our{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
