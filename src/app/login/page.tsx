"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { SocialButtons } from "@/components/auth/SocialButtons";

// OAuth/인증 콜백이 붙여 보내는 error 코드 → 사용자 메시지
const OAUTH_ERRORS: Record<string, string> = {
  oauth_state: "로그인 요청이 만료되었어요. 다시 시도해주세요.",
  oauth_failed: "간편 로그인에 실패했어요. 다시 시도해주세요.",
  oauth_config: "해당 간편 로그인이 아직 설정되지 않았어요.",
  oauth_provider: "지원하지 않는 로그인 방식이에요.",
  verify: "인증 링크가 만료되었거나 올바르지 않아요. 메일을 다시 받아보세요.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const verified = searchParams.get("verified") === "1";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(urlError ? OAUTH_ERRORS[urlError] ?? "" : "");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendState("idle");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push(next);
      router.refresh();
      return;
    }

    const data = await res.json().catch(() => null);
    const code = data?.error?.code;
    if (code === "EMAIL_NOT_VERIFIED") {
      setNeedsVerification(true);
    }
    setError(data?.error?.message ?? "로그인에 실패했습니다.");
    setLoading(false);
  }

  async function handleResend() {
    setResendState("sending");
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResendState("sent");
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-extrabold text-ink-main">로그인</h1>
      <p className="mt-1 text-sm text-ink-sub">
        다시 만나서 반가워요. 작품을 이어서 관리하세요.
      </p>

      {verified && (
        <p className="mt-4 rounded-xl bg-sky-pale px-4 py-3 text-sm font-medium text-plane-dark">
          이메일 인증이 완료되었어요. 이제 로그인할 수 있어요.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="이메일" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="creator@example.com"
            required
          />
        </Field>
        <Field label="비밀번호" htmlFor="password">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        {needsVerification && (
          <div className="rounded-xl bg-sky-pale px-4 py-3 text-sm text-ink-sub">
            {resendState === "sent" ? (
              <span className="font-medium text-plane-dark">
                인증 메일을 다시 보냈어요. 메일함을 확인해주세요.
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendState === "sending" || !email}
                className="font-bold text-plane-dark underline disabled:opacity-50"
              >
                {resendState === "sending"
                  ? "보내는 중…"
                  : "인증 메일 다시 보내기"}
              </button>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-sub">
        <span className="h-px flex-1 bg-gray-200" />
        간편 로그인
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <SocialButtons />

      <p className="mt-6 text-center text-sm text-ink-sub">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-bold text-plane-dark">
          회원가입
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
