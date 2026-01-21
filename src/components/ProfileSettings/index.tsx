// components/ProfileSettings.tsx
"use client";

import Image from "next/image";
import { Quicksand } from "next/font/google";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Link from "next/link";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Read at build time from NEXT_PUBLIC_*
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

type UpdatePayload = {
  name?: string;
  username?: string;
  image?: string;
};

export default function ProfileSettings() {
  const { data: session, status, update } = useSession();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null); // 0–100 while uploading
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!session?.user) return;
    setName(session.user.name ?? "");
    setUsername(session.user.username ?? "");
    setImage(session.user.image ?? undefined);
  }, [session?.user]);

  const canUpload = useMemo(() => CLOUD_NAME && UPLOAD_PRESET, []);

  // Upload with progress using XHR so we can show a bar
  const uploadAvatar = (file: File, onPct?: (pct: number) => void) =>
    new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      );

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.secure_url) {
            resolve(json.secure_url as string);
          } else {
            reject(new Error(json?.error?.message ?? "Upload failed"));
          }
        } catch {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onPct) {
          onPct(Math.round((e.loaded / e.total) * 100));
        }
      };

      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      xhr.send(fd);
    });

  const saveMut = useMutation({
    mutationFn: async (payload: UpdatePayload) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.json()).error ?? "Failed to update profile");
      return (await res.json()) as {
        ok: true;
        user: { id: string; username?: string };
      };
    },
    onSuccess: async () => {
      await update();
      toast.success("Profile saved");
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? "Failed to save profile");
    },
  });

  if (status === "loading") {
    return (
      <div className={`${quicksand.className}`}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`${quicksand.className}`}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You need to sign in to view your profile.
        </p>
      </div>
    );
  }
  return (
    <section className={`${quicksand.className}`}>
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/profile"
          className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          ← Back to profile
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold">Your profile</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Update your avatar, display name, and username.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-[160px,1fr]">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div className="group relative h-32 w-32 overflow-visible">
            {/* Avatar image/placeholder - outer container allows overflow */}
            <div
              className="avatar-container relative h-32 w-32 rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 cursor-pointer transition-all hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600 overflow-visible"
              onClick={() =>
                !uploading && canUpload && fileInputRef.current?.click()
              }
              title={
                !canUpload
                  ? "Missing Cloudinary client env"
                  : "Click to change avatar"
              }
              onMouseEnter={(e) => {
                // Show pencil only when hovering directly on image, not X button
                const overlay = e.currentTarget.querySelector(
                  ".pencil-overlay",
                ) as HTMLElement;
                if (
                  overlay &&
                  !e.currentTarget.querySelector(".remove-btn:hover")
                ) {
                  overlay.style.opacity = "1";
                }
              }}
              onMouseLeave={(e) => {
                // Hide pencil when leaving image area
                const overlay = e.currentTarget.querySelector(
                  ".pencil-overlay",
                ) as HTMLElement;
                if (overlay) {
                  overlay.style.opacity = "0";
                }
              }}
            >
              {/* Inner container for image with overflow-hidden for rounded corners */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {image ? (
                  <Image
                    src={image}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-zinc-100 dark:bg-zinc-800">
                    <span className="text-3xl">
                      {(session.user?.name ?? "U").charAt(0)}
                    </span>
                  </div>
                )}

                {/* Hover overlay with pencil icon - only shows when hovering directly on image */}
                <div className="pencil-overlay absolute inset-0 bg-black/40 opacity-0 transition-opacity flex items-center justify-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </div>

                {/* Upload progress overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <div className="w-24 mb-2">
                      <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-[width] duration-200"
                          style={{ width: `${progress ?? 10}%` }}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={
                            typeof progress === "number" ? progress : 0
                          }
                          role="progressbar"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-white tabular-nums">
                      {typeof progress === "number"
                        ? `${progress}%`
                        : "Uploading…"}
                    </div>
                  </div>
                )}
              </div>

              {/* X button in corner to remove - can overflow outside */}
              {image && !uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImage(undefined);
                  }}
                  className="remove-btn absolute -top-2 -right-2 h-6 w-6 rounded-full bg-pink-400 text-white shadow-lg hover:bg-pink-500 transition-colors flex items-center justify-center z-10 cursor-pointer"
                  title="Remove avatar"
                  onMouseEnter={(e) => {
                    // Hide pencil overlay when hovering X button
                    e.stopPropagation();
                    const container = e.currentTarget.closest(
                      ".avatar-container",
                    ) as HTMLElement;
                    const overlay = container?.querySelector(
                      ".pencil-overlay",
                    ) as HTMLElement;
                    if (overlay) overlay.style.opacity = "0";
                  }}
                  onMouseLeave={(e) => {
                    // Don't show pencil when leaving X button - only show when hovering directly on image
                    e.stopPropagation();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (!file || uploading) return;

              setUploading(true);
              setProgress(0);

              (async () => {
                try {
                  const url = await uploadAvatar(file, (pct) =>
                    setProgress(pct),
                  );
                  setImage(url);
                  setProgress(100);
                  toast.success("Avatar updated");
                } catch (err: unknown) {
                  console.error(err);
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Upload failed. Check your Cloudinary preset.",
                  );
                } finally {
                  input.value = "";
                  setTimeout(() => {
                    setUploading(false);
                    setProgress(null);
                  }, 350);
                }
              })();
            }}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            Click image to change • JPG/PNG/WebP
          </p>
        </div>

        {/* Form */}
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate({
              name: name?.trim(),
              username: username?.trim(),
              image,
            });
          }}
        >
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
              placeholder="Your name"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none ring-0 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-600"
              placeholder="username"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              3–20 chars, letters, numbers, underscores and dots.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="rounded-full px-5 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {saveMut.isPending ? "Saving…" : "Save changes"}
            </button>
            {saveMut.isError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {(saveMut.error as Error)?.message ?? "Error"}
              </span>
            )}
            {saveMut.isSuccess && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Optional: account meta */}
      <div className="mt-10 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold mb-2">Account</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd>{session.user?.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
            <dd>{session.user?.id}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
