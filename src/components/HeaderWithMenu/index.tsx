"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";

type HeaderProps = {
  avatarUrl?: string;
  displayName?: string;
  emailFallback?: string;
};

type Theme = "light" | "dark";

export default function HeaderWithMenu({
  avatarUrl,
  displayName,
  emailFallback,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  // Theme logic
  const [theme, setTheme] = useState<Theme>("light");

  const getSystemTheme = (): Theme => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const applyTheme = (next: Theme) => {
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = next;
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initialTheme = stored || getSystemTheme();
    applyTheme(initialTheme);

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "theme" &&
        (e.newValue === "light" || e.newValue === "dark")
      ) {
        setTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const label = displayName ?? emailFallback ?? "User";
  const initial = label?.charAt(0)?.toUpperCase() ?? "";

  // Close on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t)) return; // click on trigger
      if (menuRef.current?.contains(t)) return; // click inside menu
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Positioning
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: r.bottom + 8,
      right: Math.max(8, window.innerWidth - r.right),
    });
  }, [open]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-20 flex items-center justify-between
                   px-4 sm:px-6 py-3 backdrop-blur border-b border-zinc-200/60
                   dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70"
      >
        {/* Left logo icon */}
        <Link href="/" className="flex items-center" aria-label="Home">
          <Image
            src="/logos/exploree.png"
            alt="Exploree"
            width={48}
            height={48}
            priority
          />
        </Link>

        {/* Centered logo text */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/" className="flex items-center" aria-label="Home">
            <Image
              src="/logos/exploreeLogoTextcrop.png"
              alt="Exploree"
              width={160}
              height={40}
              priority
            />
          </Link>
        </div>

        {/* Right side - Profile with dropdown */}
        <div ref={triggerRef} className="relative flex items-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex items-center gap-2 rounded-full border
                       border-zinc-300 dark:border-zinc-700
                       px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={label}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-200 text-xs font-semibold dark:bg-zinc-700 dark:text-zinc-100">
                {initial}
              </div>
            )}
            <span className="hidden sm:inline text-sm">{label}</span>
            <svg
              className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
            </svg>
          </button>

          {open &&
            typeof window !== "undefined" &&
            createPortal(
              <div
                ref={menuRef}
                role="menu"
                className="fixed z-[1000] w-56 overflow-hidden rounded-2xl border
                           border-zinc-200 dark:border-zinc-800
                           bg-white dark:bg-zinc-900 shadow-xl"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className="block px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>

                <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 dark:text-red-400"
                >
                  Sign out
                </button>
              </div>,
              document.body
            )}
        </div>
      </header>

      {/* Sidebar - always visible on desktop */}
      <Sidebar
        avatarUrl={avatarUrl}
        displayName={displayName}
        emailFallback={emailFallback}
      />

      {/* Bottom Navigation - only on mobile */}
      <BottomNavigation avatarUrl={avatarUrl} />
    </>
  );
}
