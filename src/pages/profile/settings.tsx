// pages/profile/settings.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import HeaderWithMenu from "@/components/HeaderWithMenu";
import ProfileSettings from "@/components/ProfileSettings";

export default function ProfileSettingsPage() {
  const [qc] = useState(() => new QueryClient());
  const { data: session } = useSession();

  return (
    <QueryClientProvider client={qc}>
      <Head>
        <title>Settings • Exploree</title>
        <meta name="description" content="Edit your profile, bio, links, and preferences on Exploree." />
      </Head>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <HeaderWithMenu
          avatarUrl={session?.user?.image ?? undefined}
          displayName={
            (session?.user?.name ?? session?.user?.email ?? "U") as string
          }
        />

        <main className="px-4 sm:px-6 pt-28 pb-32 md:pb-6 md:ml-72">
          <div className="mx-auto w-full max-w-3xl">
            <ProfileSettings />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
