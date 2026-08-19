// proxy.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";

const publicExactRoutes = [
  "/",
  "/cadastro",
  "/fale-conosco",
  "/manifest.webmanifest",
  "/sw.js",
  "/~offline",
  "/favicon.ico",
  "/icon",
  "/apple-icon",
  "/icon-192",
  "/icon-512",
  "/icon-maskable-192",
  "/icon-maskable-512",
];

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/images/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webmanifest")
  );
}

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const isPublicExactRoute = publicExactRoutes.includes(pathname);
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isDocsRoute = pathname === "/docs" || pathname.startsWith("/docs/");

  const isPublicRoute =
    isPublicExactRoute || isLoginRoute || isDocsRoute || isPublicAsset(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|webp|svg|ico|webmanifest)$).*)",
  ],
};
