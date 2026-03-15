import { Quicksand } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import Head from "next/head";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Not Found | exploree</title>
      </Head>
      <div
        className={`${quicksand.className} min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <div className="flex flex-col items-center gap-8 max-w-md text-center">
          <h1 className="text-8xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-300 pb-2">
            404
          </h1>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Lost your way?</h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              The place you are looking for doesn't exist or has been moved.
            </p>
          </div>

          <Link href="/">
            <div className="rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 p-[3px] mt-4 hover:scale-105 transition-transform cursor-pointer">
              <div
                className="rounded-full px-8 py-3 text-base
                           bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100
                           font-semibold hover:bg-transparent hover:text-black transition-all"
              >
                Go back Home
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
