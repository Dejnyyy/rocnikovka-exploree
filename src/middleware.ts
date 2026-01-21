// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  (req) => {
    const token = req.nextauth?.token as { username?: string } | null;
    const { pathname, search } = req.nextUrl;
    const isHome = pathname.startsWith("/");
    const isOnboarding = pathname.startsWith("/onboarding");
    // Not logged in -> /home
    if (!token) {
      if (!isHome) {
        const url = new URL("/home", req.url);
        url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
    // Logged in but no username -> /onboarding
    const username = token?.username;
    const hasUsername =
      typeof username === "string" && username.trim().length > 0;
    if (!hasUsername && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  },
  { callbacks: { authorized: () => true } },
);

export const config = {
  matcher: [
    "/((?!api|_next|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
