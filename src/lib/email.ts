// 이메일 발송 래퍼 (Resend 무료 티어). 외부 SDK 없이 REST API를 fetch로 호출한다.
// API Key는 서버 환경변수에만 보관한다. (CLAUDE.md)

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PaperPlane <onboarding@resend.dev>";
  return { apiKey, from };
}

type SendParams = {
  to: string;
  subject: string;
  html: string;
};

// 메일을 발송한다. 실패 시 예외를 던지며, 호출 측에서 처리한다.
export async function sendEmail({ to, subject, html }: SendParams): Promise<void> {
  const { apiKey, from } = getConfig();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`메일 발송 실패 (${res.status}): ${detail.slice(0, 200)}`);
  }
}

// 이메일 인증 메일을 발송한다.
export async function sendVerificationEmail(
  to: string,
  verifyLink: string,
): Promise<void> {
  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
    <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px;">PaperPlane 이메일 인증</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
      가입을 완료하려면 아래 버튼을 눌러 이메일을 인증해주세요.<br/>
      언어가 달라져도, 이야기가 주는 설렘은 같아야 합니다. ✈
    </p>
    <a href="${verifyLink}"
       style="display: inline-block; margin: 24px 0; padding: 14px 28px; border-radius: 9999px; background: linear-gradient(90deg, #22C7C7, #38BDF8); color: #ffffff; font-weight: 700; text-decoration: none;">
      이메일 인증하기
    </a>
    <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
      버튼이 눌리지 않으면 아래 링크를 복사해 브라우저에 붙여넣으세요.<br/>
      <span style="word-break: break-all; color: #6b7280;">${verifyLink}</span>
    </p>
    <p style="font-size: 13px; color: #9ca3af;">이 링크는 24시간 후 만료됩니다.</p>
  </div>`;

  await sendEmail({
    to,
    subject: "[PaperPlane] 이메일 인증을 완료해주세요",
    html,
  });
}
