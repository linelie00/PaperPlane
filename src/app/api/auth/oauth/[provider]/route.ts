import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl, isProviderId } from "@/lib/oauth";
import { generateToken } from "@/lib/utils";

export const STATE_COOKIE = "pp_oauth_state";

// GET /api/auth/oauth/[provider] — 제공자 로그인 시작 (CSRF state 발급 후 리다이렉트)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isProviderId(provider)) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_provider", _req.url),
    );
  }

  let authorizeUrl: string;
  const state = generateToken();
  try {
    authorizeUrl = buildAuthorizeUrl(provider, state);
  } catch {
    // client id/secret 미설정
    return NextResponse.redirect(
      new URL("/login?error=oauth_config", _req.url),
    );
  }

  // state를 httpOnly 단기 쿠키에 저장해 콜백에서 검증한다. (CSRF 방지)
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10분
  });

  return NextResponse.redirect(authorizeUrl);
}
