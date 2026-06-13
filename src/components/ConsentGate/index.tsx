import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const PENDING_KEY = "exploree:pendingConsent";

export function markPendingConsent() {
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {}
}

export function hasPendingConsent(): boolean {
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPendingConsent() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

export default function ConsentGate() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-[300px] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-pink-500"
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>{" "}
          and the use of necessary{" "}
          <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
            cookies
          </Link>
          .
        </span>
      </label>

      <div className="rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 p-[3px]">
        <button
          disabled={!agreed}
          onClick={() => {
            markPendingConsent();
            signIn("google");
          }}
          className="w-full rounded-full px-8 py-3 text-base
                     bg-black text-white font-semibold transition-all
                     enabled:cursor-pointer enabled:hover:bg-gradient-to-r enabled:hover:from-pink-400 enabled:hover:to-yellow-300 enabled:hover:text-black
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
