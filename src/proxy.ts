import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "pp_session";

// 로그인 사용자 보호 라우팅 (docs/02_USER_FLOW.md)
const PROTECTED_PREFIXES = ["/dashboard", "/works", "/profile", "/feed"];

async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (await isValidToken(token)) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/works/:path*",
    "/profile/:path*",
    "/feed/:path*",
  ],
};
