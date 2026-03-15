import type { NextAuthConfig } from "next-auth";

const protectedRoutes = ["/dashboard", "/lesson", "/conversation", "/scenarios", "/leaderboard"];
const authRoutes = ["/login", "/register"];

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
      const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

      if (isProtected && !isLoggedIn) {
        // Redirect to /login with only the pathname as callbackUrl (no host/port)
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  providers: [],
};
