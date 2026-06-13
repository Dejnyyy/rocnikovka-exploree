# Exploree — Polish & Hardening Design

**Date:** 2026-06-13
**Status:** Approved (pending spec review)

Polishing pass on the Exploree app (Next.js Pages Router, Prisma + MySQL, NextAuth
Google OAuth, React Query, Framer Motion, Tailwind v4). Five independent
improvements; each can be implemented and committed on its own.

---

## 1. Comment deletion

**Problem:** Users cannot delete their own comments, nor comments left by others on
their own spots. [api/comments.ts](../../../src/pages/api/comments.ts) only has
`GET` and `POST`.

**Design:**

- **API** — add `DELETE /api/comments` accepting `{ commentId }`.
  - Require an authenticated session (401 otherwise).
  - Load the comment with `select: { userId, spot: { select: { authorId } } }`.
  - 404 if not found.
  - Authorize: allow if `session.user.id === comment.userId` **OR**
    `session.user.id === comment.spot.authorId`. Otherwise 403.
  - `prisma.comment.delete({ where: { id } })`, return 200.
- **UI** — [CommentSection](../../../src/components/CommentSection/index.tsx):
  - Add prop `spotAuthorId?: string`.
  - The GET response already includes `user.id`. For each comment, show a small
    trash button when `session.user.id === c.user.id || session.user.id === spotAuthorId`.
  - Clicking asks for a lightweight confirm, then calls `DELETE`, and on success
    optimistically removes the comment from local state (it already animates via
    `AnimatePresence`).
- **Plumbing** — pass `spotAuthorId` down:
  - Extend the `Spot` type used in [index.tsx](../../../src/pages/index.tsx) and
    the explore mapping to carry `authorId` (add `author.id` / `authorId` to
    `SPOT_SELECT` and `formatSpots` in
    [api/explore.ts](../../../src/pages/api/explore.ts)).
  - Pass `spotAuthorId` from the desktop comment panel in `index.tsx` and through
    [CommentSheet](../../../src/components/CommentSheet/index.tsx) (mobile).
  - Also verify the standalone spot page [spot/[slug].tsx](../../../src/pages/spot/[slug].tsx)
    passes `spotAuthorId` if it renders `CommentSection`.

**Out of scope:** soft delete / moderation queue / edit. Hard delete only.

---

## 2. Infinite swipe (recycling)

**Problem:** Swiping stops after ~26 places (the whole DB). Root cause:
[index.tsx](../../../src/pages/index.tsx) accumulates **all** seen IDs across pages
into `seenIds`, and every tier in
[api/explore.ts](../../../src/pages/api/explore.ts) — including the "recycled"
tier 3 — excludes `seenIds` (`id: { notIn: seenIds }`). Once every spot is seen,
all tiers return 0 → `getNextPageParam` returns `undefined` → `hasNextPage` false
→ deck stops.

**Decision:** Infinite recycling. The deck never ends; once fresh spots are
exhausted, already-seen spots reshuffle and reappear, avoiding immediate repeats.

**Design:**

- **Client** ([index.tsx](../../../src/pages/index.tsx)):
  - Stop accumulating the full `seenIds` forever. Instead send a bounded
    "recently seen" window (e.g. the last ~30 IDs) so recycling won't return the
    spot the user just dismissed.
  - `getNextPageParam` always returns a param (never `undefined`), so
    `hasNextPage` stays `true`.
- **API** ([api/explore.ts](../../../src/pages/api/explore.ts)):
  - Tier 1 (followed) and Tier 2 (discovery) still exclude the recently-seen
    window so genuinely new content is preferred first.
  - Tier 3 (recycled) is reworked to **always** top the response up to `limit`:
    it draws from a shuffled pool excluding only the IDs already in the current
    response and the recently-seen window. It must never return 0 when the DB has
    any spots, so the client always has more to show.
  - Keep `nextCursor: null` (pagination is window-based, not cursor-based).

**Result:** continuous deck, no back-to-back repeats, fresh content still first.

---

## 3. Privacy & Cookies pages accessible when logged out

**Problem:** [middleware.ts](../../../src/middleware.ts) redirects every non-home
route to `/` when there is no token, so `/privacy` is unreachable before login.
Sign-in on the landing already works; only the legal pages are blocked.

**Design:**

- In the "no token" branch of the middleware, allow `/privacy` **and** the new
  `/cookies` route to pass through (`NextResponse.next()`) instead of redirecting.
- These pages render fine without a session (static legal content).

---

## 4. Cookie consent (binary, take-it-or-leave-it)

**Decision:** No granular toggles, no "reject and still use" path. Using the app
means accepting the (essential-only) cookies. Before login the user either accepts
and proceeds, or does not use the app. Consent covers Privacy Policy + cookies in
one combined acceptance.

**What is actually stored (for accurate disclosure):**
- Own MySQL database on an Oracle Cloud VPS — all app content/user data.
- NextAuth session cookie (JWT strategy) — strictly necessary for auth.
- Google OAuth as the identity provider (Google receives auth-related data).

**Design:**

- **DB** — add to `User`:
  - `consentedAt DateTime?`
  - `consentVersion String? @db.VarChar(20)` (e.g. `"2026-06-13"`)
  - Prisma migration.
- **New `/cookies` page** — lists exactly what is stored and why (session cookie,
  Oracle VPS DB, Google OAuth), states that using the app implies acceptance,
  matches the app's visual style. Public (see §3).
- **Sign-in gate** ([index.tsx](../../../src/pages/index.tsx) landing):
  - A checkbox: "I agree to the Privacy Policy and the use of necessary cookies",
    linking to `/privacy` and `/cookies`.
  - `Continue with Google` is `disabled` until checked.
  - On submit, store the pending acceptance in `localStorage` before redirecting to
    Google.
- **Persist after auth** — `POST /api/consent` sets `consentedAt = now()` and
  `consentVersion`. Called after returning from OAuth when a pending acceptance is
  in `localStorage`; also enforced as a fallback during onboarding.
- **Existing users without consent** — a lightweight modal/banner shown after
  login while `consentedAt == null`; accepting calls the same endpoint. There is
  no decline-and-continue option (consistent with the binary policy).
- **Settings** ([ProfileSettings](../../../src/components/ProfileSettings/index.tsx)):
  a "Privacy & cookies" section showing consent status + date and links to
  `/privacy` and `/cookies`. Because only necessary cookies are used, withdrawal =
  stop using / delete account; the section explains this and links to the rights
  described in the Privacy Policy.
- **Privacy Policy** ([privacy.tsx](../../../src/pages/privacy.tsx)): tighten
  sections 6 (Storage) and 8 (Cookies) to match reality (Oracle VPS MySQL,
  NextAuth session cookie, Google OAuth).

---

## 5. Landing page + style unification

**Decision:** Multi-section landing for logged-out users, in the onboarding visual
language (Quicksand font, pink→yellow gradient, radial glow blobs, dark mode).

**Design:**

- Replace the bare logo + button in the `!session` branch of
  [index.tsx](../../../src/pages/index.tsx) with a scrolling landing:
  1. **Hero** — logo, tagline, short description, and the sign-in block with the
     consent checkbox (§4).
  2. **How it works** — 3 steps: swipe places → save to collections → follow people.
  3. **Feature cards** — swipe deck, collections, map, profiles.
  4. **Footer** — links to Privacy Policy, Cookies, contact.
- **Style unification:** introduce shared visual primitives (glow background,
  gradient button) reused by the landing, the consent surfaces, and the onboarding
  screen so they match. Targeted alignment of color/font/buttons where the login
  and onboarding currently diverge — not a rewrite of every page.

---

## Implementation order (suggested)

1. Privacy/cookies middleware allowlist (§3) — unblocks the legal pages.
2. `/cookies` page + Privacy Policy text (§4 partial).
3. Comment deletion (§1).
4. Infinite swipe (§2).
5. Cookie consent DB + gate + settings + modal (§4 rest).
6. Landing page + style unification (§5).
