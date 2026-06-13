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
      <label className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300 max-w-[340px] leading-relaxed cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="sr-only peer"
        />
        {/* Custom checkbox */}
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2
                     border-zinc-300 dark:border-zinc-600
                     peer-checked:group-[]:border-transparent peer-checked:group-[]:bg-gradient-to-r peer-checked:group-[]:from-pink-400 peer-checked:group-[]:to-yellow-300
                     transition-all duration-200"
          style={agreed ? { border: "none", background: "linear-gradient(to right, #f472b6, #fde047)" } : {}}
        >
          {agreed && (
            <svg className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="underline underline-offset-2 font-medium hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>{" "}
          and the use of necessary{" "}
          <Link href="/cookies" className="underline underline-offset-2 font-medium hover:text-zinc-900 dark:hover:text-zinc-100">
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
