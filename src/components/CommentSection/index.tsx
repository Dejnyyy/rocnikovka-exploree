// components/CommentSection/index.tsx
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CommentSection({
  spotId,
  className = "",
  refreshKey = 0,
  onCommentPosted,
}: {
  spotId: string;
  className?: string;
  refreshKey?: number;
  onCommentPosted?: () => void;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch comments (re-fetches when refreshKey changes)
  useEffect(() => {
    if (!spotId) return;
    setLoading(true);
    fetch(`/api/comments?spotId=${spotId}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [spotId, refreshKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId, text: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const { comment } = await res.json();
      setComments((prev) => [comment, ...prev]);
      setText("");
      onCommentPosted?.();
      // Scroll to top of list to show the new comment
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <h3 className="mb-4 text-base font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-shrink-0">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        Comments
        {!loading && (
          <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comment input */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 text-base outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
            />
          </div>
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-base font-medium text-white dark:text-zinc-900 disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {sending ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white dark:border-zinc-900 border-t-transparent dark:border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      ) : (
        <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
          Sign in to comment
        </p>
      )}

      {/* Comments list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin overflow-x-hidden"
      >
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3.5 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
            No comments yet — be the first!
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 pt-0.5">
                  {c.user.username ? (
                    <Link href={`/u/${c.user.username}`}>
                      {c.user.image ? (
                        <Image
                          src={c.user.image}
                          alt={c.user.name ?? "User"}
                          width={36}
                          height={36}
                          className="rounded-full hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:opacity-80 transition-opacity">
                          {(c.user.name ?? "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  ) : c.user.image ? (
                    <Image
                      src={c.user.image}
                      alt={c.user.name ?? "User"}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[12px] font-medium text-zinc-600 dark:text-zinc-300">
                      {(c.user.name ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    {c.user.username ? (
                      <Link
                        href={`/u/${c.user.username}`}
                        className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate hover:underline"
                      >
                        {c.user.name ?? `@${c.user.username}`}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {c.user.name ?? `@${c.user.username}`}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 break-words leading-relaxed mt-0.5">
                    {c.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
