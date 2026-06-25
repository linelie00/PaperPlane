import { db } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24시간

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// 사용자에게 새 인증 토큰을 발급·저장하고 인증 메일을 보낸다.
// 원본 토큰은 메일 링크로만 전달하고, DB에는 SHA-256 해시만 저장한다.
export async function issueAndSendVerification(
  userId: string,
  email: string,
): Promise<void> {
  // 기존 토큰은 폐기하고 새로 발급한다.
  await db.emailVerificationToken.deleteMany({ where: { userId } });

  const token = generateToken();
  await db.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const link = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendVerificationEmail(email, link);
}
