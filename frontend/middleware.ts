import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/leaderboard")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = String(token?.role ?? "");
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/submit") || pathname.startsWith("/prompts")) {
    if (role !== "participant") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (pathname.startsWith("/judge")) {
    if (role !== "judge" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
