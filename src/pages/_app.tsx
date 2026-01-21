import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import "@/styles/globals.css";

import { ToastContainer } from "react-toastify";
import { GlobalLoader } from "@/context/GlobalLoader";

type Theme = "light" | "dark";

function ThemeAwareToastContainer() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || "light";
    setTheme(t);
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

  return (
    <ToastContainer
      position="top-right"
      theme={theme}
      autoClose={2500}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
    />
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider
      session={(pageProps as { session?: Session | null })?.session}
    >
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <GlobalLoader />
        <ThemeAwareToastContainer />
      </QueryClientProvider>
    </SessionProvider>
  );
}
