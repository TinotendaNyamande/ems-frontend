import { NextRequest, NextResponse } from "next/server";

const isAuthRoute = (pathname: string) =>
  pathname.startsWith("/login") || pathname.startsWith("/signup");

export async function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(
    request.cookies.get("refreshToken")?.value || request.cookies.get("RefreshToken")?.value
  );
  const pathname = request.nextUrl.pathname;
  const isPrefetchRequest =
    request.headers.get("x-middleware-prefetch") === "1" ||
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose") === "prefetch";
  const isDebug = request.nextUrl.searchParams.get("debug") === "1";

  const respondNext = () => {
    const res = NextResponse.next();
    if (isDebug) {
      res.headers.set("x-fc-proxy", "allow");
      res.headers.set("x-fc-proxy-cookie", hasSessionCookie ? "1" : "0");
      res.headers.set("x-fc-proxy-prefetch", isPrefetchRequest ? "1" : "0");
      res.headers.set("x-fc-proxy-path", pathname);
    }
    return res;
  };

  const respondRedirect = (to: string, reason: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    if (isDebug) {
      res.headers.set("x-fc-proxy", reason);
      res.headers.set("x-fc-proxy-cookie", hasSessionCookie ? "1" : "0");
      res.headers.set("x-fc-proxy-prefetch", isPrefetchRequest ? "1" : "0");
      res.headers.set("x-fc-proxy-path", pathname);
    }
    return res;
  };

  if (isAuthRoute(pathname)) {
    return respondNext();
  }

  if (pathname.startsWith("/admin") && !hasSessionCookie && !isPrefetchRequest) {
    return respondRedirect("/not-authorized", "redirect-not-authorized");
  }

  if (pathname.startsWith("/profile") && !hasSessionCookie && !isPrefetchRequest) {
    return respondRedirect("login", "redirect-login-profile");
  }

  if (
    !hasSessionCookie &&
    !isPrefetchRequest &&
    (pathname.startsWith("/ipl/"))
  ) {
    return respondRedirect("/login", "redirect-login-league-private");
  }

  return respondNext();
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "x-middleware-prefetch" },
        { type: "header", key: "purpose" },
      ],
    },
  ],
};
