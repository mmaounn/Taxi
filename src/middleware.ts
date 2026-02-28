import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  const publicPaths = ["/login", "/register", "/api/auth", "/api/register", "/api/validate-credentials"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Landing page is public
  if (pathname === "/") {
    return NextResponse.next();
  }

  if (isPublic) {
    if (isAuthenticated && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      // Redirect logged-in users away from auth pages
      if (role === "DRIVER") {
        return NextResponse.redirect(new URL("/driver-portal", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Require authentication for everything else
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Driver portal access - drivers only
  if (pathname.startsWith("/driver-portal")) {
    if (role !== "DRIVER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes - admin/staff only
  if (role === "DRIVER") {
    return NextResponse.redirect(new URL("/driver-portal", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
