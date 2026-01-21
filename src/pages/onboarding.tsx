import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import HeaderWithMenu from "@/components/HeaderWithMenu";

/* ---------------- core --------------------------------------------------- */
const USERNAME_RE = /^[a-zA-Z0-9._]{3,20}$/;

function toHandle(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 20);
}

/* ---------------- tiny theme helpers ------------------------------------- */
/** Make sure your tailwind.config.js has:  darkMode: 'class' */
function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function getStoredTheme(): "dark" | "light" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("theme");
  return v === "dark" || v === "light" ? v : null;
}
function applyTheme(t: "dark" | "light") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.setAttribute("data-theme", t);
  root.style.colorScheme = t;
  localStorage.setItem("theme", t);
}

/* ---------------- page --------------------------------------------------- */
export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  // ui
  const [raw, setRaw] = useState("");
  const [username, setUsername] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // availability
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  // suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // theme
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // init theme
  useEffect(() => {
    const initial = getStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "theme" &&
        (e.newValue === "dark" || e.newValue === "light")
      ) {
        setTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  // debounce username check
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    const val = toHandle(raw);
    setUsername(val);
    setAvailable(null);
    setError("");

    if (!val || !USERNAME_RE.test(val)) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch(
          `/api/profile/username?username=${encodeURIComponent(val)}`,
        );
        if (!r.ok) throw new Error("check failed");
        const j = await r.json();
        setAvailable(!!j.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 350) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [raw]);

  // build suggestions
  useEffect(() => {
    const n = session?.user?.name ?? "";
    const email = session?.user?.email ?? "";
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0] ?? "";
    const last = parts[parts.length - 1] ?? "";
    const yy = new Date().getFullYear().toString().slice(2);

    const pool = [
      toHandle(first),
      toHandle(last),
      toHandle(first + last),
      toHandle((first[0] ?? "") + last),
      toHandle(first + (last[0] ?? "")),
      toHandle(email.split("@")[0] ?? ""),
      toHandle(`${first}.${last}`),
      toHandle(`${first}${yy}`),
    ];

    const uniq = Array.from(new Set(pool))
      .filter((p) => USERNAME_RE.test(p))
      .slice(0, 6);
    setSuggestions(uniq);
  }, [session?.user?.name, session?.user?.email]);

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center bg-white text-zinc-900 dark:bg-[#1f1f2b] dark:text-white transition-colors">
        <p className="text-sm text-zinc-500 dark:text-white/60">
          You need to sign in
        </p>
      </div>
    );
  }

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault();
    setLoadingSubmit(true);
    setError("");

    if (!USERNAME_RE.test(username)) {
      setError(
        "Username must be 3–20 chars (letters, numbers, underscores, dots).",
      );
      setLoadingSubmit(false);
      return;
    }
    if (available === false) {
      setError("This username is already taken.");
      setLoadingSubmit(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to set username");
      }
      await update();
      router.push(`/u/${username}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingSubmit(false);
    }
  }

  const canSubmit =
    USERNAME_RE.test(username) &&
    available === true &&
    !checking &&
    !loadingSubmit;

  if (!mounted) return null;

  return (
    <div
      className="relative min-h-screen overflow-hidden transition-colors
                 bg-white text-zinc-900
                 dark:bg-[#1f1f2b] dark:text-white"
    >
      {/* background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl opacity-20 dark:opacity-40"
          style={{
            background: "radial-gradient(closest-side, #8e79ff, transparent)",
          }}
        />
        <div
          className="absolute top-20 right-[-6rem] h-80 w-80 rounded-full blur-3xl opacity-20 dark:opacity-40"
          style={{
            background: "radial-gradient(closest-side, #f17ea7, transparent)",
          }}
        />
        <div
          className="absolute bottom-[-8rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-15 dark:opacity-30"
          style={{
            background: "radial-gradient(closest-side, #fcd77f, transparent)",
          }}
        />
      </div>

      {/* header */}
      <header
        className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur transition-colors
                   border-zinc-200/70 dark:border-white/10 dark:bg-[#1f1f2b]/70"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <HeaderWithMenu
            displayName={session.user?.name ?? session.user?.email ?? "User"}
            avatarUrl={session.user?.image ?? undefined}
          />
        </div>
      </header>

      {/* content */}
      <main className="relative">
        <div className="mx-auto max-w-2xl px-4 py-14">
          {/* step header */}
          <div className="mb-6 flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm
                         bg-zinc-100 text-zinc-700
                         dark:bg-white/10 dark:text-white"
            >
              1
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Create your handle
              </h1>
              <p className="text-sm text-zinc-500 dark:text-white/60">
                This will be your public URL.
              </p>
            </div>
          </div>

          {/* card */}
          <div
            className="rounded-3xl border p-6 backdrop-blur transition-colors
                       border-zinc-200/70 bg-white/70 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.25)]
                       dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.7)]"
          >
            {/* profile strip */}
            <div className="mb-5 flex items-center gap-3">
              <div
                className="h-9 w-9 overflow-hidden rounded-full border
                           border-zinc-200/70 bg-zinc-100
                           dark:border-white/10 dark:bg-white/10"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {session.user?.name || session.user?.email || "New user"}
                </p>
                <p className="text-xs text-zinc-500 dark:text-white/50">
                  Finish setup in under 30s
                </p>
              </div>
            </div>

            {/* form */}
            <form
              onSubmit={saveUsername}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !canSubmit) e.preventDefault();
              }}
              className="space-y-5"
            >
              <div
                className="hidden sm:flex items-center gap-2 rounded-full border px-2 py-1 transition-colors
                          border-zinc-200/80 bg-white/70
                          dark:border-white/10 dark:bg-white/5"
              >
                <span className="text-xs text-zinc-500 dark:text-white/60">
                  /u/
                </span>
                <span className="font-mono text-xs">
                  {username || "username"}
                </span>
              </div>
              <div>
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-zinc-800 dark:text-white/90"
                >
                  Username
                </label>

                <div
                  className={[
                    "mt-2 flex items-center rounded-2xl border px-3 ring-0 transition-colors",
                    "bg-white focus-within:ring-4 border-zinc-300 text-zinc-900",
                    "dark:bg-black/30 dark:border-white/15 dark:text-white",
                    checking
                      ? "focus-within:ring-zinc-200/60 dark:focus-within:ring-white/10"
                      : available === true
                        ? "border-emerald-400/40 focus-within:ring-emerald-400/10"
                        : available === false
                          ? "border-rose-400/40 focus-within:ring-rose-400/10"
                          : "focus-within:ring-zinc-200/60 dark:focus-within:ring-white/10",
                  ].join(" ")}
                >
                  <span className="select-none pr-1 text-zinc-400 dark:text-white/50">
                    @
                  </span>
                  <input
                    id="username"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full bg-transparent py-2.5 outline-none placeholder:text-zinc-400 dark:placeholder:text-white/30"
                    placeholder="yourname"
                  />
                  <div className="pl-2">
                    {checking ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-transparent dark:border-white/30" />
                    ) : available === true ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                        available
                      </span>
                    ) : available === false ? (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-700 dark:text-rose-300">
                        taken
                      </span>
                    ) : username && !USERNAME_RE.test(username) ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                        invalid
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2 text-xs text-zinc-500 dark:text-white/60">
                  3–20 characters: letters, numbers,{" "}
                  <code className="font-mono">_</code>,{" "}
                  <code className="font-mono">.</code>
                </p>
              </div>
              {suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 dark:text-white/60">
                    Suggestions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRaw(s)}
                        className="rounded-full border px-3 py-1 text-sm transition-colors
                                   border-zinc-300 bg-white hover:bg-zinc-50
                                   dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div
                  className="rounded-xl border px-3 py-2 text-sm transition-colors
                             border-rose-300/60 bg-rose-200/40 text-rose-800
                             dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
                >
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={!canSubmit || loadingSubmit}
                className="group relative w-full overflow-hidden rounded-2xl px-4 py-3 font-medium text-black disabled:opacity-50 bg-gradient-to-r from-pink-400 to-yellow-300 hover:from-pink-500 hover:to-yellow-400 transition-all"
              >
                {loadingSubmit ? "Saving…" : "Save username"}
              </button>
              <p className="text-center text-xs text-zinc-500 dark:text-white/60">
                You can change this later in settings.
              </p>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-white/50">
            <span>Press</span>
            <kbd
              className="rounded-md border px-1.5 py-0.5 text-[10px]
                         border-zinc-300 bg-white
                         dark:border-white/20 dark:bg-white/5"
            >
              Enter
            </kbd>
            <span>to submit</span>
          </div>
        </div>
      </main>
    </div>
  );
}
