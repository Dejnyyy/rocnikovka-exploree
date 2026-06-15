import type { AppProps } from "next/app";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Quicksand } from "next/font/google";
import { useRouter } from "next/router";

import "@/styles/globals.css";

import { ToastContainer } from "react-toastify";
import { GlobalLoader } from "@/context/GlobalLoader";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
  const router = useRouter();
  const cleanPath = router.asPath.split("?")[0].split("#")[0];
  const canonicalUrl = `https://exploree.dejny.eu${cleanPath === "/" ? "" : cleanPath}`;

  return (
    <SessionProvider
      session={(pageProps as { session?: Session | null })?.session}
    >
      <QueryClientProvider client={queryClient}>
        {/* Site-wide SEO + social-share defaults (rendered on the server for
            every page, so crawlers and link unfurlers always see them) */}
        <Head>
          <title>Exploree — Discover places worth the trip</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <meta
            name="description"
            content="Swipe through real spots shared by real people, save your favourites, and follow explorers with great taste. Free, beautiful, and community-driven."
          />
          <meta name="theme-color" content="#f472b6" />

          <link rel="canonical" href={canonicalUrl} key="canonical" />

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Exploree" />
          <meta
            property="og:title"
            content="Exploree — Discover places worth the trip"
          />
          <meta
            property="og:description"
            content="Swipe through real spots shared by real people, save your favourites into collections, and follow explorers with great taste."
          />
          <meta property="og:url" content={canonicalUrl} />
          <meta
            property="og:image"
            content="https://exploree.dejny.eu/og-image.png"
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content="Exploree — discover places worth the trip"
          />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@exploree" />
          <meta
            name="twitter:title"
            content="Exploree — Discover places worth the trip"
          />
          <meta
            name="twitter:description"
            content="Swipe through real spots shared by real people, save your favourites into collections, and follow explorers with great taste."
          />
          <meta
            name="twitter:image"
            content="https://exploree.dejny.eu/og-image.png"
          />
        </Head>
        <div className={quicksand.className}>
          <Component {...pageProps} />
          <GlobalLoader />
          <ThemeAwareToastContainer />
        </div>
      </QueryClientProvider>
    </SessionProvider>
  );
}
