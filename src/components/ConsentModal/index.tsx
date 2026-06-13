import { useState } from "react";
import Link from "next/link";

export default function ConsentModal({ onAccept }: { onAccept: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function accept() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/consent", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      onAccept();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-2">Before you continue</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
          To keep using Exploree, please confirm you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>{" "}
          and the use of necessary{" "}
          <Link href="/cookies" className="underline underline-offset-2">cookies</Link>. We only
          use cookies that are strictly necessary to run the app.
        </p>
        <button
          onClick={accept}
          disabled={submitting}
          className="w-full rounded-xl px-4 py-3 font-medium text-black bg-gradient-to-r from-pink-400 to-yellow-300 hover:from-pink-500 hover:to-yellow-400 transition-all disabled:opacity-50"
        >
          {submitting ? "Saving…" : "I agree"}
        </button>
      </div>
    </div>
  );
}
