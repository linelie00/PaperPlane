import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { fetchProfile, isProviderId, type ProviderId } from "@/lib/oauth";
import { STATE_COOKIE } from "../route";

function redirectLogin(req: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url));
}

// 제공자가 이메일을 주지 않을 때(예: Kakao 미검수) 사용할 자리표시자 이메일
function placeholderEmail(provider: ProviderId, accountId: string): string {
  return `${provider}_${accountId}@social.paperplane.local`;
}

// GET /api/auth/oauth/[provider]/callback — 인가 콜백 처리
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isProviderId(provider)) return redirectLogin(req, "oauth_provider");

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // 1) state(CSRF) 검증
  const cookieStore = await cookies();
  const saved = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  if (!code || !state || saved !== `${provider}:${state}`) {
    return redirectLogin(req, "oauth_state");
  }

  // 2~3) 코드 교환 + 프로필 조회
  let profile;
  try {
    profile = await fetchProfile(provider, code, state);
  } catch {
    return redirectLogin(req, "oauth_failed");
  }

  // 4) 기존 계정 찾기 → 이메일로 연결 → 신규 생성
  let user = await db.user.findFirst({
    where: {
      accounts: {
        some: { provider, providerAccountId: profile.providerAccountId },
      },
    },
  });

  if (!user) {
    const email =
      profile.email?.trim().toLowerCase() ||
      placeholderEmail(provider, profile.providerAccountId);

    // 이미 같은 이메일로 가입된 사용자가 있으면 OAuth 계정을 연결한다.
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      user = await db.user.update({
        where: { id: existing.id },
        data: {
          // 소셜 이메일은 제공자가 검증하므로 미인증 계정도 인증 처리한다.
          emailVerified: existing.emailVerified ?? new Date(),
          image: existing.image ?? profile.image,
          accounts: {
            create: {
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
      });
    } else {
      const nickname =
        profile.name?.trim() || email.split("@")[0] || "creator";
      user = await db.user.create({
        data: {
          email,
          nickname,
          image: profile.image,
          emailVerified: new Date(),
          accounts: {
            create: {
              provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
      });
    }
  }

  // 5) 세션 발급 후 대시보드로 이동 (기존 JWT 세션 재사용)
  const token = await createToken({
    userId: user.id,
    email: user.email,
    nickname: user.nickname,
  });
  await setSessionCookie(token);

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
