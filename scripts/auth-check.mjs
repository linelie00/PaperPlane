// 이메일 인증 게이트 E2E 검증 (실제 메일/OAuth 키 없이 동작).
// 1) 가입 → emailVerified=null, 토큰 생성 확인
// 2) 미인증 로그인 → 403 EMAIL_NOT_VERIFIED 차단 확인
// 3) 알려진 토큰을 직접 심고 /api/auth/verify 호출 → 인증 처리 확인
// 4) 인증 후 로그인 → 200 + 세션 쿠키 확인
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

const B = "http://localhost:3000";
const db = new PrismaClient();
const sha256 = (v) => createHash("sha256").update(v).digest("hex");

const email = `auth_${Date.now()}@example.com`;
const password = "password1234";
const out = {};

// 1) 가입 (메일 발송은 RESEND 키 없으면 실패하지만 가입은 유지됨)
const signupRes = await fetch(`${B}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password, nickname: "인증테스트" }),
});
const signup = await signupRes.json();
out.signupStatus = signupRes.status;
out.verificationSent = signup.verificationSent;

const user = await db.user.findUnique({
  where: { email },
  include: { verificationTokens: true },
});
out.emailVerifiedAfterSignup = user.emailVerified; // null이어야 함
out.tokenRowCreated = user.verificationTokens.length === 1;

// 2) 미인증 로그인 차단
const blockedRes = await fetch(`${B}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const blocked = await blockedRes.json();
out.blockedStatus = blockedRes.status; // 403
out.blockedCode = blocked.error?.code; // EMAIL_NOT_VERIFIED

// 3) 알려진 토큰을 심고 verify 호출
const rawToken = randomBytes(32).toString("base64url");
await db.emailVerificationToken.deleteMany({ where: { userId: user.id } });
await db.emailVerificationToken.create({
  data: {
    userId: user.id,
    tokenHash: sha256(rawToken),
    expiresAt: new Date(Date.now() + 60000),
  },
});
const verifyRes = await fetch(
  `${B}/api/auth/verify?token=${encodeURIComponent(rawToken)}`,
  { redirect: "manual" },
);
out.verifyRedirect = verifyRes.headers.get("location"); // /login?verified=1
const verifiedUser = await db.user.findUnique({ where: { email } });
out.emailVerifiedAfterVerify = !!verifiedUser.emailVerified; // true

// 4) 인증 후 로그인 성공
const loginRes = await fetch(`${B}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
out.loginStatus = loginRes.status; // 200
out.gotSessionCookie = (loginRes.headers.getSetCookie?.() ?? []).some((c) =>
  c.startsWith("pp_session="),
);

console.log(JSON.stringify(out, null, 2));
await db.$disconnect();
