# Exploree Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Exploree app — comment deletion, never-ending swipe deck, public legal pages, a binary cookie-consent flow stored in the DB, and a multi-section landing page with a unified visual style.

**Architecture:** Next.js Pages Router app, Prisma + MySQL, NextAuth (Google OAuth, JWT sessions), React Query, Framer Motion, Tailwind v4. Bug-prone pure logic (delete authorization, swipe recycling) is extracted into `src/lib/*` and unit-tested with Vitest. UI/integration changes are verified with `npm run build`, `npm run lint`, and manual browser checks because the project has no component-test harness.

**Tech Stack:** TypeScript, Next 15, React 19, Prisma 6, NextAuth 4, Tailwind 4, Vitest (new).

**Note on tests:** The repo currently has zero test infrastructure. Task 1 adds a minimal Vitest setup used only for pure functions. Do **not** attempt React component or API-route integration tests — verify those via build/lint/manual steps as written.

**Independence:** The seven parts (Tasks 1–N) are grouped by feature and each ends in its own commit. They can be implemented in the order below (which front-loads the quick wins) or cherry-picked.

---

## Task 1: Add minimal Vitest harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/__smoke__.test.ts` (temporary smoke test, deleted in Step 6)

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` added to devDependencies, no errors.

- [ ] **Step 2: Add test script**

In `package.json`, add a `test` script to the `"scripts"` block so it reads:
```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Create Vitest config with the `@` alias**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Add a smoke test**

Create `src/lib/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/lib/__smoke__.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add minimal Vitest harness for pure-logic unit tests"
```

---

## Task 2: Make Privacy & Cookies pages public (§3)

**Files:**
- Modify: `src/middleware.ts:12-19`

- [ ] **Step 1: Allow `/privacy` and `/cookies` through when logged out**

In `src/middleware.ts`, replace the `if (!token) { ... }` block:
```ts
    // Not logged in -> /home, except public legal pages
    if (!token) {
      const isPublic =
        isHome ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/cookies");
      if (!isPublic) {
        const url = new URL("/", req.url);
        url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`
Expected: build succeeds (no TypeScript errors). It is fine if it warns about other pre-existing issues; it must not fail on `middleware.ts`.

- [ ] **Step 3: Manual check**

Run `npm run dev`, open an incognito window (logged out), go to `http://localhost:3000/privacy`.
Expected: the Privacy Policy renders instead of redirecting to `/`. (`/cookies` is created in Task 3.)

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts
git commit -m "fix: allow privacy and cookies pages without login"
```

---

## Task 3: Add Cookies page and tighten Privacy Policy text (§4 partial)

**Files:**
- Create: `src/pages/cookies.tsx`
- Modify: `src/pages/privacy.tsx:166-202` (sections 6 and 8)

- [ ] **Step 1: Create the Cookies page**

Create `src/pages/cookies.tsx`. It mirrors the structure/style of `src/pages/privacy.tsx` (Quicksand font, same container classes, Back link to `/`):
```tsx
// pages/cookies.tsx
import { Quicksand } from "next/font/google";
import Link from "next/link";
import Head from "next/head";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function CookiesPage() {
  return (
    <>
      <Head>
        <title>Cookies — Exploree</title>
        <meta
          name="description"
          content="What cookies and data Exploree stores, and what you accept by using the app."
        />
      </Head>

      <div
        className={`${quicksand.className} min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <main className="mx-auto max-w-2xl px-6 py-16 pb-32">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-8"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
            Back
          </Link>

          <h1 className="text-3xl font-bold mb-2">Cookies &amp; Data</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
            Last updated: June 13, 2026
          </p>

          <div className="space-y-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Using Exploree means accepting these cookies
              </h2>
              <p>
                Exploree only uses cookies that are strictly necessary to run the
                app. There is no tracking, advertising, or third-party analytics
                cookie. Because every cookie we set is essential, there is no
                opt-out: by signing in and using Exploree you accept the cookies
                described below. If you do not want to accept them, please do not
                use the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Cookies we set
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Authentication session:</strong> A secure session cookie
                  managed by NextAuth keeps you signed in. Without it you could not
                  stay logged in.
                </li>
                <li>
                  <strong>Theme preference:</strong> Your light/dark choice is kept
                  in your browser&apos;s local storage so the app remembers it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Where your data is stored
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Our database:</strong> Your account, spots, collections,
                  comments and related content are stored in our own MySQL database
                  hosted on an Oracle Cloud virtual server.
                </li>
                <li>
                  <strong>Google sign-in:</strong> We use Google as the sign-in
                  provider. When you sign in, Google processes your authentication
                  and shares your name, email and profile picture with us. Google&apos;s
                  own cookies and policies apply during that sign-in.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Your choices
              </h2>
              <p>
                You can withdraw consent at any time by signing out and requesting
                deletion of your account, which removes your data from our database.
                For the full picture of how we handle your information, see our{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Tighten Privacy Policy sections 6 and 8**

In `src/pages/privacy.tsx`, replace the body `<p>` of section 6 (Data Storage & Security):
```tsx
              <p>
                Your data is stored in our own MySQL database hosted on an Oracle
                Cloud virtual server. We use industry-standard measures to protect
                it. While we strive to protect your personal information, no method
                of electronic storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
```
And replace the body `<p>` of section 8 (Cookies & Analytics):
```tsx
              <p>
                We only use cookies that are strictly necessary to operate the app
                — primarily the authentication session cookie that keeps you signed
                in. We do not use advertising or third-party analytics cookies. For
                details on what we store and what you accept by using Exploree, see
                our{" "}
                <Link
                  href="/cookies"
                  className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  Cookies &amp; Data page
                </Link>
                .
              </p>
```

- [ ] **Step 3: Verify build + manual check**

Run: `npm run build`
Expected: succeeds. Then `npm run dev`, logged out, open `http://localhost:3000/cookies` and `http://localhost:3000/privacy`.
Expected: both render; the privacy page links to `/cookies` and vice versa.

- [ ] **Step 4: Commit**

```bash
git add src/pages/cookies.tsx src/pages/privacy.tsx
git commit -m "feat: add cookies page, align privacy policy with real storage"
```

---

## Task 4: Comment-delete authorization helper (§1) — TDD

**Files:**
- Create: `src/lib/comments.ts`
- Test: `src/lib/comments.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/comments.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { canDeleteComment } from "./comments";

describe("canDeleteComment", () => {
  it("lets the comment author delete their own comment", () => {
    expect(
      canDeleteComment({
        viewerId: "u1",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(true);
  });

  it("lets the spot author delete a comment on their spot", () => {
    expect(
      canDeleteComment({
        viewerId: "u2",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(true);
  });

  it("rejects an unrelated user", () => {
    expect(
      canDeleteComment({
        viewerId: "u3",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(false);
  });

  it("rejects when viewerId is empty/undefined", () => {
    expect(
      canDeleteComment({
        viewerId: "",
        commentAuthorId: "u1",
        spotAuthorId: "u2",
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./comments` / `canDeleteComment is not a function`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/comments.ts`:
```ts
export function canDeleteComment(args: {
  viewerId: string | undefined | null;
  commentAuthorId: string;
  spotAuthorId: string;
}): boolean {
  const { viewerId, commentAuthorId, spotAuthorId } = args;
  if (!viewerId) return false;
  return viewerId === commentAuthorId || viewerId === spotAuthorId;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comments.ts src/lib/comments.test.ts
git commit -m "feat: add canDeleteComment authorization helper"
```

---

## Task 5: DELETE endpoint for comments (§1)

**Files:**
- Modify: `src/pages/api/comments.ts`

- [ ] **Step 1: Add the DELETE branch**

In `src/pages/api/comments.ts`, import the helper at the top (after the existing imports):
```ts
import { canDeleteComment } from "@/lib/comments";
```
Then, immediately before the final `return res.status(405)...` line, add:
```ts
  // ---------- DELETE  /api/comments ----------
  if (req.method === "DELETE") {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { commentId } = req.body as { commentId?: string };
    if (!commentId) {
      return res.status(400).json({ error: "commentId is required" });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
        spot: { select: { authorId: true } },
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const allowed = canDeleteComment({
      viewerId: session.user.id as string,
      commentAuthorId: comment.userId,
      spotAuthorId: comment.spot.authorId,
    });
    if (!allowed) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return res.status(200).json({ ok: true });
  }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors in `comments.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/comments.ts
git commit -m "feat: DELETE /api/comments with author/spot-owner authorization"
```

---

## Task 6: Delete button in CommentSection + plumb spotAuthorId (§1)

**Files:**
- Modify: `src/components/CommentSection/index.tsx`
- Modify: `src/components/CommentSheet/index.tsx`
- Modify: `src/pages/index.tsx` (Spot type + explore mapping + desktop panel + InfiniteSwipeDeck props as needed)
- Modify: `src/pages/api/explore.ts` (expose author id)
- Modify: `src/pages/spot/[slug].tsx` (pass spotAuthorId)

- [ ] **Step 1: Expose the author id from the explore API**

In `src/pages/api/explore.ts`, update `SPOT_SELECT` author select:
```ts
  author: { select: { id: true, name: true, image: true, username: true } },
```
And in `formatSpots`, add the author id to the returned `user` object and a top-level `authorId`:
```ts
    return {
      id: s.id,
      slug: s.slug || s.id,
      title: s.title ?? "Untitled",
      mediaUrl: s.coverUrl || s.image,
      width: null,
      height: null,
      kind: "image",
      authorId: s.author?.id ?? "",
      user: {
        name: s.author?.name ?? "Unknown",
        avatar:
          s.author?.image ??
          "https://api.dicebear.com/8.x/identicon/svg?seed=explore",
        handle: s.author?.username ?? undefined,
      },
      location,
      likes: s._count.likes ?? 0,
      comments: 0,
      tags,
      exploreReason: s.exploreReason,
    };
```
Also add `authorId?: string;` to the `Pin` type at the top of the file.

- [ ] **Step 2: Carry authorId through index.tsx**

In `src/pages/index.tsx`:
- Add `authorId?: string;` to the local `Spot` type and to the `ExplorePin` type.
- In the `.map(...)` that builds `spots`, add `authorId: p.authorId,` to the returned object.
- Where the desktop `CommentSection` is rendered, pass the current spot's author id. Track it alongside `currentSpotId`. Replace the `onCardChange` handler's `setCurrentSpotId(s?.id ?? null)` with also storing the author id, and add a `currentSpotAuthorId` state:

```tsx
  const [currentSpotId, setCurrentSpotId] = useState<string | null>(null);
  const [currentSpotAuthorId, setCurrentSpotAuthorId] = useState<string | null>(
    null,
  );
```
In `onCardChange`:
```tsx
                onCardChange={(s) => {
                  setCurrentSpotId(s?.id ?? null);
                  setCurrentSpotAuthorId(s?.authorId ?? null);
                  if (s) {
                    console.log(
                      `%c[Explore Deck] 📍 ${s.title}`,
                      "color: #ff00ff; font-weight: bold; font-size: 14px;",
                    );
                    console.log(
                      `%c   -> ${s.exploreReason || "Neznámý (starý formát nebo fallback)"}`,
                      "color: #00ffff; font-style: italic;",
                    );
                  }
                }}
```
And on the desktop `CommentSection`:
```tsx
              <CommentSection
                key={currentSpotId}
                spotId={currentSpotId}
                spotAuthorId={currentSpotAuthorId ?? undefined}
                className="flex-1 min-h-0"
                refreshKey={commentRefreshKey}
              />
```

> Note: `InfiniteSwipeDeck`'s `onCardChange` already passes the spot object. Confirm the `Spot` type it uses includes `authorId` (it imports from `@/components/SwipeDeck`). If that type is separately declared, add `authorId?: string;` there too so the value is not stripped.

- [ ] **Step 2b: Ensure the SwipeDeck Spot type carries authorId**

Open `src/components/SwipeDeck/index.tsx` (and `src/components/InfiniteSwipeDeck/index.tsx`). Find the exported `Spot` type. Add `authorId?: string;` to it if not present, so the field survives the trip through the deck to `onCardChange`.

- [ ] **Step 3: Add delete UI to CommentSection**

In `src/components/CommentSection/index.tsx`:
- Add `spotAuthorId` to the props type and destructure it:
```tsx
export default function CommentSection({
  spotId,
  className = "",
  refreshKey = 0,
  onCommentPosted,
  spotAuthorId,
}: {
  spotId: string;
  className?: string;
  refreshKey?: number;
  onCommentPosted?: () => void;
  spotAuthorId?: string;
}) {
```
- Import the helper at the top:
```tsx
import { canDeleteComment } from "@/lib/comments";
```
- Add a delete handler inside the component:
```tsx
  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== commentId));
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      console.error(err);
      setComments(prev); // roll back on failure
    }
  }
```
- In the comment row, after the `<p>` with `c.text` (inside the content `<div className="flex-1 min-w-0">`), add a conditional delete button:
```tsx
                  {canDeleteComment({
                    viewerId: session?.user?.id as string | undefined,
                    commentAuthorId: c.user.id,
                    spotAuthorId: spotAuthorId ?? "",
                  }) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="mt-1 text-[11px] text-zinc-400 hover:text-rose-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
```

> `session.user.id` must be typed. The project already augments NextAuth types in `src/types/next-auth.d.ts`; `session.user.id` is used elsewhere (e.g. explore API), so this compiles. If TS complains in the client, cast as shown (`as string | undefined`).

- [ ] **Step 4: Pass spotAuthorId through CommentSheet (mobile)**

In `src/components/CommentSheet/index.tsx`, add `spotAuthorId` to props and forward it:
```tsx
export function CommentSheet({
  open,
  spotId,
  onClose,
  onCommentPosted,
  spotAuthorId,
}: {
  open: boolean;
  spotId: string;
  onClose: () => void;
  onCommentPosted?: () => void;
  spotAuthorId?: string;
}) {
```
And on the rendered `<CommentSection ... />` inside it, add `spotAuthorId={spotAuthorId}`.

Then in `src/pages/index.tsx`, wherever `InfiniteSwipeDeck` renders the mobile `CommentSheet` internally: check `src/components/InfiniteSwipeDeck/index.tsx`. If the `CommentSheet` is rendered inside `InfiniteSwipeDeck`, thread `spotAuthorId` from the current card to it (the deck already knows the current spot — pass `spot.authorId`). If it cannot be threaded cleanly there, it is acceptable for this pass to enable delete on desktop + spot page only and leave the mobile sheet delete for the spot page (Step 5), but prefer wiring it.

- [ ] **Step 5: Pass spotAuthorId on the spot detail page**

In `src/pages/spot/[slug].tsx`:
- The `spot.author.id` is already selected in `getServerSideProps`. Pass it to both comment renderers.
- Desktop `CommentSection` (around line 475):
```tsx
            <CommentSection
              spotId={spot.id}
              spotAuthorId={spot.author.id}
              className="max-h-[400px]"
              refreshKey={commentRefreshKey}
            />
```
- Mobile `CommentSheet` (around line 495):
```tsx
        <CommentSheet
          open={commentsOpen}
          spotId={spot.id}
          spotAuthorId={spot.author.id}
          onClose={() => setCommentsOpen(false)}
          onCommentPosted={() => setCommentRefreshKey((k) => k + 1)}
        />
```

- [ ] **Step 6: Verify build + lint + manual**

Run: `npm run build && npm run lint`
Expected: both succeed.
Manual (`npm run dev`): open a spot you authored → comments from others show a "Delete" button; deleting removes it. Open a comment you wrote on someone else's spot → "Delete" shows on your own comment only. A comment by someone else on someone else's spot → no button.

- [ ] **Step 7: Commit**

```bash
git add src/components/CommentSection/index.tsx src/components/CommentSheet/index.tsx src/components/SwipeDeck/index.tsx src/components/InfiniteSwipeDeck/index.tsx src/pages/index.tsx src/pages/api/explore.ts src/pages/spot/\[slug\].tsx
git commit -m "feat: delete comments as comment author or spot owner"
```

---

## Task 7: Infinite-swipe helpers (§2) — TDD

**Files:**
- Create: `src/lib/feed.ts`
- Test: `src/lib/feed.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/feed.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { trimRecentlySeen, selectRecycled } from "./feed";

describe("trimRecentlySeen", () => {
  it("returns all ids when under the limit", () => {
    expect(trimRecentlySeen(["a", "b"], 5)).toEqual(["a", "b"]);
  });

  it("keeps only the most recent ids when over the limit", () => {
    expect(trimRecentlySeen(["a", "b", "c", "d"], 2)).toEqual(["c", "d"]);
  });

  it("dedupes while keeping last occurrence order", () => {
    expect(trimRecentlySeen(["a", "b", "a", "c"], 10)).toEqual(["b", "a", "c"]);
  });
});

describe("selectRecycled", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

  it("excludes recently-seen ids", () => {
    const out = selectRecycled(pool, ["a", "b"], 10, () => 0);
    expect(out.map((s) => s.id)).not.toContain("a");
    expect(out.map((s) => s.id)).not.toContain("b");
  });

  it("returns at most `limit` items", () => {
    const out = selectRecycled(pool, [], 2, () => 0);
    expect(out).toHaveLength(2);
  });

  it("returns items from the pool when nothing is excluded", () => {
    const out = selectRecycled(pool, [], 10, () => 0);
    expect(out).toHaveLength(4);
  });

  it("falls back to the full pool when everything is excluded but pool is non-empty", () => {
    const out = selectRecycled(pool, ["a", "b", "c", "d"], 2, () => 0);
    expect(out).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./feed`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/feed.ts`:
```ts
/** Keep only the most recent `max` ids, de-duplicated (last occurrence wins). */
export function trimRecentlySeen(ids: string[], max: number): string[] {
  const seen = new Set<string>();
  const reversedUnique: string[] = [];
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i];
    if (!seen.has(id)) {
      seen.add(id);
      reversedUnique.push(id);
    }
  }
  const unique = reversedUnique.reverse();
  return unique.length <= max ? unique : unique.slice(unique.length - max);
}

/**
 * Pick up to `limit` items from `pool`, excluding `excludeIds`, shuffled.
 * If excluding empties the candidate set but the pool is non-empty, fall back
 * to the whole pool so the deck never starves.
 * `rng` defaults to Math.random; injectable for tests.
 */
export function selectRecycled<T extends { id: string }>(
  pool: T[],
  excludeIds: string[],
  limit: number,
  rng: () => number = Math.random,
): T[] {
  const exclude = new Set(excludeIds);
  let candidates = pool.filter((s) => !exclude.has(s.id));
  if (candidates.length === 0 && pool.length > 0) {
    candidates = [...pool];
  }
  const shuffled = [...candidates].sort(() => 0.5 - rng());
  return shuffled.slice(0, limit);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all `feed` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/feed.ts src/lib/feed.test.ts
git commit -m "feat: add feed recycling helpers (trimRecentlySeen, selectRecycled)"
```

---

## Task 8: Wire infinite swipe into API + client (§2)

**Files:**
- Modify: `src/pages/api/explore.ts` (Tier 3 + always-return)
- Modify: `src/pages/index.tsx` (`getNextPageParam` bounded window)

- [ ] **Step 1: Use selectRecycled in the explore API Tier 3**

In `src/pages/api/explore.ts`, import the helper near the top:
```ts
import { selectRecycled } from "@/lib/feed";
```
Replace the Tier 3 block (the `if (remaining > 0) { const pool = ... }` that does `pool.sort(() => 0.5 - Math.random())`) with:
```ts
    // ─── TIER 3: Recycled (already seen/saved/skipped, shuffled) ───
    // Never excludes the full global seen list — only the ids already in THIS
    // response (seenIds, which T1/T2 pushed into) — so the deck never starves.
    if (remaining > 0) {
      const pool = await prisma.spot.findMany({
        where: userId ? { authorId: { not: userId } } : {},
        select: SPOT_SELECT,
        orderBy: { id: "desc" },
        take: Math.max(remaining * 5, 50),
      });

      const selected = selectRecycled(pool, seenIds, remaining);

      console.log(`[T3 Recycled] ${selected.length}/${remaining}`);

      const enriched = selected.map((s) => ({
        ...s,
        exploreReason: "♻️ Znovu objevené místo",
      }));
      results.push(...enriched);
      remaining -= selected.length;
    }
```

> The pool query no longer excludes the global `seenIds`; `selectRecycled` only excludes the ids already chosen in this response. The author-of-the-spot is still excluded for logged-in users so you never recycle your own spots.

- [ ] **Step 2: Bound the client's seen window so hasNextPage stays true**

In `src/pages/index.tsx`, import the helper:
```ts
import { trimRecentlySeen } from "@/lib/feed";
```
Replace `getNextPageParam`:
```ts
    getNextPageParam: (lastPage, allPages) => {
      // Only send a bounded window of recently-seen ids so the server prefers
      // fresh content first but can always recycle older spots. We never return
      // undefined, so the deck keeps requesting forever.
      const allSeenIds = allPages.flatMap((p) => p.items.map((i) => i.id));
      const recentlySeen = trimRecentlySeen(allSeenIds, 30);
      return {
        cursor: lastPage.nextCursor ?? undefined,
        seenIds: recentlySeen,
      };
    },
```

> Removing the `if (lastPage.items.length === 0) return undefined;` line is intentional — with Tier 3 always topping up, the server should never return 0 while any spot exists. If the DB is genuinely empty, `spots.length === 0` already shows the "No places yet" message in the UI.

- [ ] **Step 3: Verify build + manual**

Run: `npm run build`
Expected: succeeds.
Manual (`npm run dev`, logged in): swipe past the number of spots in your DB (the old ~26 limit). Expected: cards keep coming, labelled "♻️ Znovu objevené místo" once fresh content runs out, and you do not immediately see the exact card you just dismissed.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/explore.ts src/pages/index.tsx
git commit -m "fix: never-ending swipe deck via bounded seen window + recycling"
```

---

## Task 9: Consent DB fields + persistence endpoint (§4)

**Files:**
- Modify: `prisma/schema.prisma` (User model)
- Create: `src/pages/api/consent.ts`
- Create: `src/lib/consent.ts` (shared constant)

> **Important:** This repo has **no `prisma/migrations` directory** — it uses `prisma db push` (schema-sync), not `prisma migrate`. Do **not** run `prisma migrate dev`: on an existing DB with no migration history it can prompt to **reset the database** (data loss on the VPS). Use `db push` as written below.

- [ ] **Step 1: Add the shared consent version constant**

Create `src/lib/consent.ts`:
```ts
/** Bump this string whenever the privacy/cookies terms materially change. */
export const CONSENT_VERSION = "2026-06-13";
```

- [ ] **Step 2: Add fields to the User model**

In `prisma/schema.prisma`, inside `model User`, add after the `updatedAt` line:
```prisma
  consentedAt   DateTime?
  consentVersion String?  @db.VarChar(20)
```

- [ ] **Step 3: Push the schema and regenerate the client**

The repo generates its client to `src/generated/prisma` (per `output` in `prisma/schema.prisma`) and has no migrations folder, so use `db push` (non-destructive schema sync) — **not** `migrate`.

Run:
```bash
npx prisma db push
```
Expected: the two new nullable columns are added to the `User` table and the Prisma client is regenerated into `src/generated/prisma`. Because both fields are nullable, no existing-row backfill is needed.

If no database is reachable in this environment, at minimum run `npx prisma generate` so the client types include `consentedAt`/`consentVersion`, and run `npx prisma db push` against the real DB at deploy time.

- [ ] **Step 4: Create the consent endpoint**

Create `src/pages/api/consent.ts`:
```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { CONSENT_VERSION } from "@/lib/consent";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { consentedAt: true, consentVersion: true },
    });
    return res.status(200).json({
      consentedAt: user?.consentedAt ?? null,
      consentVersion: user?.consentVersion ?? null,
      currentVersion: CONSENT_VERSION,
    });
  }

  if (req.method === "POST") {
    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { consentedAt: new Date(), consentVersion: CONSENT_VERSION },
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

- [ ] **Step 5: Verify build + commit**

Run: `npm run build`
Expected: succeeds (the new Prisma fields are recognized).
```bash
git add prisma/schema.prisma src/lib/consent.ts src/pages/api/consent.ts src/generated/prisma
git commit -m "feat: store user consent (consentedAt, consentVersion) + /api/consent"
```

---

## Task 10: Consent gate on sign-in + re-prompt modal (§4)

**Files:**
- Create: `src/components/ConsentGate/index.tsx` (the checkbox block for the landing)
- Create: `src/components/ConsentModal/index.tsx` (re-prompt for existing users)
- Modify: `src/pages/index.tsx` (use ConsentGate in the landing; mount ConsentModal in AuthedHome; persist pending consent on mount)

- [ ] **Step 1: Build the ConsentGate (checkbox + gated Google button)**

Create `src/components/ConsentGate/index.tsx`:
```tsx
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const PENDING_KEY = "exploree:pendingConsent";

export function markPendingConsent() {
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {}
}

export function hasPendingConsent(): boolean {
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPendingConsent() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {}
}

export default function ConsentGate() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <label className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 max-w-[300px] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-pink-500"
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>{" "}
          and the use of necessary{" "}
          <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
            cookies
          </Link>
          .
        </span>
      </label>

      <div className="rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 p-[3px]">
        <button
          disabled={!agreed}
          onClick={() => {
            markPendingConsent();
            signIn("google");
          }}
          className="w-full rounded-full px-8 py-3 text-base
                     bg-black text-white font-semibold transition-all
                     enabled:cursor-pointer enabled:hover:bg-gradient-to-r enabled:hover:from-pink-400 enabled:hover:to-yellow-300 enabled:hover:text-black
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the ConsentModal (re-prompt existing users)**

Create `src/components/ConsentModal/index.tsx`:
```tsx
import { useState } from "react";
import Link from "next/link";

export default function ConsentModal({ onAccept }: { onAccept: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  async function accept() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/consent", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      onAccept();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold mb-2">Before you continue</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
          To keep using Exploree, please confirm you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>{" "}
          and the use of necessary{" "}
          <Link href="/cookies" className="underline underline-offset-2">cookies</Link>. We only
          use cookies that are strictly necessary to run the app.
        </p>
        <button
          onClick={accept}
          disabled={submitting}
          className="w-full rounded-xl px-4 py-3 font-medium text-black bg-gradient-to-r from-pink-400 to-yellow-300 hover:from-pink-500 hover:to-yellow-400 transition-all disabled:opacity-50"
        >
          {submitting ? "Saving…" : "I agree"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Persist pending consent + mount the modal in AuthedHome**

In `src/pages/index.tsx`:
- Import at the top:
```tsx
import ConsentModal from "@/components/ConsentModal";
import { hasPendingConsent, clearPendingConsent } from "@/components/ConsentGate";
```
- In `AuthedHome`, add state + an effect that (a) flushes a pending consent set on the landing, and (b) fetches consent status to decide whether to show the modal:
```tsx
  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Flush a pending acceptance recorded on the landing before OAuth.
      if (hasPendingConsent()) {
        await fetch("/api/consent", { method: "POST" }).catch(() => {});
        clearPendingConsent();
      }
      const res = await fetch("/api/consent").catch(() => null);
      if (!res || cancelled) return;
      const data = await res.json().catch(() => null);
      if (data && !data.consentedAt) setNeedsConsent(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
```
(Add `useEffect` to the React import at the top of the file.)
- Render the modal at the end of `AuthedHome`'s returned JSX, before the closing `</div>`:
```tsx
      {needsConsent && <ConsentModal onAccept={() => setNeedsConsent(false)} />}
```

- [ ] **Step 4: Use ConsentGate on the landing**

This step is folded into Task 11 (the landing rewrite) since both touch the `!session` branch. For now, if Task 11 is deferred, replace the existing inline Google button + privacy `<p>` in the `!session` branch of `src/pages/index.tsx` with:
```tsx
import ConsentGate from "@/components/ConsentGate";
// ... inside the !session branch, in place of the button + paragraph:
          <ConsentGate />
```

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Manual check**

`npm run dev`, logged out: the "Continue with Google" button is disabled until the checkbox is ticked. After signing in as a brand-new user, the consent is persisted (no modal). For an existing user whose `consentedAt` is null (set one to null in the DB to test), the modal appears after login and disappears after clicking "I agree".

- [ ] **Step 7: Commit**

```bash
git add src/components/ConsentGate src/components/ConsentModal src/pages/index.tsx
git commit -m "feat: binary cookie/privacy consent gate on sign-in + re-prompt modal"
```

---

## Task 11: Landing page + consent settings + style unification (§5 + §4 settings)

**Files:**
- Modify: `src/pages/index.tsx` (`!session` branch → multi-section landing using `ConsentGate`)
- Modify: `src/components/ProfileSettings/index.tsx` (Privacy & cookies section)

- [ ] **Step 1: Read the current ProfileSettings to match its patterns**

Run: `sed -n '1,80p' src/components/ProfileSettings/index.tsx`
Expected: understand how sections/cards are structured so the new section matches.

- [ ] **Step 2: Add a "Privacy & cookies" section to ProfileSettings**

In `src/components/ProfileSettings/index.tsx`, add a section that fetches `/api/consent` (GET) on mount and shows status. Place it consistent with existing sections:
```tsx
// near other useState/useEffect:
const [consent, setConsent] = useState<{
  consentedAt: string | null;
  consentVersion: string | null;
} | null>(null);

useEffect(() => {
  fetch("/api/consent")
    .then((r) => r.json())
    .then((d) => setConsent(d))
    .catch(() => {});
}, []);
```
And the rendered section (match the card/heading classes used by the file's other sections — example using neutral Tailwind that fits the app):
```tsx
<section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
  <h3 className="text-base font-semibold mb-2">Privacy & cookies</h3>
  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
    {consent?.consentedAt
      ? `You accepted our Privacy Policy and necessary cookies on ${new Date(
          consent.consentedAt,
        ).toLocaleDateString()}.`
      : "We could not find a recorded consent for your account."}
  </p>
  <p className="text-sm text-zinc-600 dark:text-zinc-400">
    Exploree uses only strictly necessary cookies. To withdraw consent, sign out
    and request account deletion. Read more in our{" "}
    <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>{" "}
    and{" "}
    <a href="/cookies" className="underline underline-offset-2">Cookies page</a>.
  </p>
</section>
```
(Add `useState`/`useEffect` to imports if not present.)

- [ ] **Step 3: Replace the landing `!session` branch with a multi-section landing**

In `src/pages/index.tsx`, replace the `if (!session) { return ( ... ) }` block with a multi-section landing in the onboarding visual language (Quicksand already applied via `quicksand.className`, glow blobs, pink→yellow gradient). Use `ConsentGate` for the sign-in block:
```tsx
  if (!session) {
    return (
      <div
        className={`${quicksand.className} relative min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 overflow-x-hidden`}
      >
        {/* background glows (matches onboarding) */}
        <div className="pointer-events-none fixed inset-0">
          <div
            className="absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl opacity-20 dark:opacity-40"
            style={{ background: "radial-gradient(closest-side, #8e79ff, transparent)" }}
          />
          <div
            className="absolute top-20 right-[-6rem] h-80 w-80 rounded-full blur-3xl opacity-20 dark:opacity-40"
            style={{ background: "radial-gradient(closest-side, #f17ea7, transparent)" }}
          />
          <div
            className="absolute bottom-[-8rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl opacity-15 dark:opacity-30"
            style={{ background: "radial-gradient(closest-side, #fcd77f, transparent)" }}
          />
        </div>

        <main className="relative z-10 mx-auto max-w-5xl px-6">
          {/* Hero */}
          <section className="flex flex-col items-center text-center pt-20 pb-16 gap-6">
            <Image src="/logos/exploree.png" alt="Exploree logo" width={160} height={160} priority />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Discover places worth the trip.
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              Swipe through real spots shared by real people, save the ones you love
              into collections, and follow explorers with great taste.
            </p>
            <div className="mt-2">
              <ConsentGate />
            </div>
          </section>

          {/* How it works */}
          <section className="py-12">
            <h2 className="text-center text-2xl font-bold mb-8">How it works</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { n: "1", t: "Swipe to explore", d: "Browse a never-ending deck of places. Skip what's not for you, keep what is." },
                { n: "2", t: "Save to collections", d: "Organize your favourite spots into collections you can revisit and share." },
                { n: "3", t: "Follow explorers", d: "Follow people whose taste you trust and see their newest finds first." },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 backdrop-blur">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 text-sm font-semibold text-black">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-1">{s.t}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature highlights */}
          <section className="py-12">
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { t: "A swipe deck that never runs dry", d: "Endless discovery, fresh places first, favourites resurfaced." },
                { t: "Collections", d: "Group spots into public or private collections." },
                { t: "Map view", d: "See where every place sits on the map." },
                { t: "Profiles", d: "A public page for everything you've shared." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 backdrop-blur">
                  <h3 className="font-semibold mb-1">{f.t}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{f.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center justify-center gap-4">
              <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Privacy Policy</Link>
              <Link href="/cookies" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Cookies</Link>
              <a href="mailto:support@exploree.dejny.eu" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Contact</a>
            </div>
            <p className="mt-4">© {new Date().getFullYear()} Exploree</p>
          </footer>
        </main>
      </div>
    );
  }
```
Ensure `ConsentGate` is imported at the top: `import ConsentGate from "@/components/ConsentGate";` (added in Task 10 Step 4 — keep it).

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 5: Manual check**

`npm run dev`, logged out at `http://localhost:3000/`: a scrolling landing with hero + consent gate + "how it works" + features + footer, in the glow/gradient style. Footer links to `/privacy` and `/cookies` work. Logged in, in profile settings: the "Privacy & cookies" section shows the consent date.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.tsx src/components/ProfileSettings/index.tsx
git commit -m "feat: multi-section landing page + consent status in settings"
```

---

## Self-review notes

- **§1 comment deletion** → Tasks 4 (helper, tested), 5 (DELETE endpoint), 6 (UI + plumbing across deck/sheet/spot page). Covered.
- **§2 infinite swipe** → Tasks 7 (helpers, tested), 8 (API Tier 3 + client window). Covered.
- **§3 public legal pages** → Task 2 (middleware). Covered.
- **§4 cookie consent** → Tasks 3 (cookies page + privacy text), 9 (DB + endpoint), 10 (gate + modal), 11 step 2 (settings). Covered.
- **§5 landing + style** → Task 11 (landing) + shared gradient/glow primitives reused from onboarding. Covered.
- **Type consistency:** `canDeleteComment` args (`viewerId`/`commentAuthorId`/`spotAuthorId`), `selectRecycled`/`trimRecentlySeen`, `spotAuthorId` prop, `CONSENT_VERSION`, and the `/api/consent` GET shape (`consentedAt`/`consentVersion`/`currentVersion`) are used consistently across tasks.
- **No DB test infra:** intentional — pure logic is unit-tested; everything else is build/lint/manual per the header note.
