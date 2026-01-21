// src/components/Sidebar/index.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type SidebarProps = {
  avatarUrl?: string;
  displayName?: string;
  emailFallback?: string;
};

type Theme = "light" | "dark";

type ActiveTab = "home" | "new" | "profile" | "explore" | "people" | "saved";

function ThemeSwitcher() {
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

    // Sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "theme" &&
        (e.newValue === "light" || e.newValue === "dark")
      ) {
        applyTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const baseBtn =
    "flex-1 rounded-xl px-3 py-2 text-left border transition-colors";
  const active =
    "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800";
  const inactive =
    "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div className="px-4 py-2" role="group" aria-label="Theme">
      <div className="px-3 pb-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Theme
      </div>
      <div className="flex gap-2 px-2 pb-2">
        <button
          className={`${baseBtn} ${theme === "light" ? active : inactive}`}
          onClick={() => applyTheme("light")}
          aria-pressed={theme === "light"}
        >
          Light
        </button>
        <button
          className={`${baseBtn} ${theme === "dark" ? active : inactive}`}
          onClick={() => applyTheme("dark")}
          aria-pressed={theme === "dark"}
        >
          Dark
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({
  avatarUrl,
  displayName,
  emailFallback,
}: SidebarProps) {
  const router = useRouter();
  const label = displayName ?? emailFallback ?? "User";
  const initial = label?.charAt(0)?.toUpperCase() ?? "";
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  useEffect(() => {
    const path = router.asPath.split("?")[0];
    if (path === "/" || path === "") {
      setActiveTab("home");
    } else if (path.includes("/places/new")) {
      setActiveTab("new");
    } else if (path.includes("/profile")) {
      setActiveTab("profile");
    } else if (path.includes("/explore")) {
      setActiveTab("explore");
    } else if (path.includes("/people") || path.includes("/u/")) {
      setActiveTab("people");
    } else if (path.includes("/saved")) {
      setActiveTab("saved");
    } else {
      setActiveTab("home");
    }
  }, [router.asPath]);

  return (
    <aside
      className="hidden md:flex fixed left-0 top-24 bottom-0 w-72 overflow-y-auto z-10
                 "
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="w-full flex flex-col">
        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-4">
          <Link
            href="/"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                       transition-colors relative ${
                         activeTab === "home"
                           ? "bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300 text-black dark:text-white dark:border-yellow-300"
                           : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                       }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
                clipRule="evenodd"
              />
            </svg>
            Home
          </Link>

          <Link
            href="/places/new"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                       hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                         activeTab === "new"
                           ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300"
                           : ""
                       }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New
          </Link>

          <Link
            href="/profile"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                       hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                         activeTab === "profile"
                           ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300"
                           : ""
                       }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            Profile
          </Link>

          <Link
            href="/explore"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  activeTab === "explore"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300"
                    : ""
                }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            Explore
          </Link>

          <Link
            href="/people"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  activeTab === "people"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300"
                    : ""
                }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path
                fillRule="evenodd"
                d="M.5 15.5A3.5 3.5 0 014 12h6a3.5 3.5 0 013.5 3.5v1a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-1zM14 12a2.5 2.5 0 012.5 2.5v.5h-5v-.5A2.5 2.5 0 0114 12z"
                clipRule="evenodd"
              />
            </svg>
            People
          </Link>

          <Link
            href="/saved"
            className={`${
              quicksand.className
            } flex items-center gap-3 rounded-full px-4 py-3 text-lg font-semibold
                hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                  activeTab === "saved"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white bg-gradient-to-r from-pink-400 to-yellow-300 dark:from-pink-400 dark:to-yellow-300"
                    : ""
                }`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5 3a2 2 0 00-2 2v11.382a1 1 0 001.553.833L10 14.618l5.447 2.597A1 1 0 0017 16.382V5a2 2 0 00-2-2H5z" />
            </svg>
            Saved
          </Link>

          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

          <ThemeSwitcher />
        </nav>
      </div>
    </aside>
  );
}
