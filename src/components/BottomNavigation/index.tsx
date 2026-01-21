"use client";

import Link from "next/link";
import { useRouter } from "next/router";

type BottomNavigationProps = {
  avatarUrl?: string;
};

export default function BottomNavigation({ avatarUrl }: BottomNavigationProps) {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/") {
      return router.pathname === "/";
    }
    return router.pathname === path || router.pathname.startsWith(path + "/");
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30
                 border-t border-zinc-200 dark:border-zinc-800
                 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm
                 safe-area-inset-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            isActive("/")
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label="Home"
        >
          <svg
            className="h-6 w-6"
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
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            isActive("/explore")
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label="Explore"
        >
          <svg
            className="h-6 w-6"
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
          <span className="text-[10px]">Explore</span>
        </Link>

        <Link
          href="/places/new"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            isActive("/places/new")
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label="New"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 00 1.5h4.5v4.5a.75.75 0 0 01.5 0v-4.5h4.5a.75.75 0 0 00-1.5h-4.5v-4.5z" />
          </svg>
          <span className="text-[10px]">New</span>
        </Link>

        <Link
          href="/people"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            isActive("/people")
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label="People"
        >
          <svg
            className="h-6 w-6"
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
          <span className="text-[10px]">People</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            isActive("/profile")
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          aria-label="Profile"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-6 w-6 rounded-lg object-cover"
            />
          ) : (
            <svg
              className="h-6 w-6"
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
          )}
          <span className="text-[10px]">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
