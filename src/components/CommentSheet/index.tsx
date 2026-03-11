"use client";

import { motion, AnimatePresence } from "framer-motion";
import CommentSection from "@/components/CommentSection";

export function CommentSheet({
  open,
  spotId,
  onClose,
  onCommentPosted,
}: {
  open: boolean;
  spotId: string;
  onClose: () => void;
  onCommentPosted?: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-xl flex-col rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-zinc-900 sm:w-[540px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="relative mt-2">
              <button
                onClick={onClose}
                className="absolute -right-1 -top-6 rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Close comments"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <CommentSection
              spotId={spotId}
              className="h-[70vh] flex flex-col"
              onCommentPosted={onCommentPosted}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
