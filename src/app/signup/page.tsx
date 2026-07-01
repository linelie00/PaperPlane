"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import { validatePassword, PASSWORD_RULE_HINT } from "@/lib/utils";

export default function SignupPage() {
  const [nickname, setNickname] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 가입 완료 후 안내 상태
  const [done, setDone] = useState(false);
  const [verificationSent, setVerificationSent] = useState(true);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) {
      setError(pwCheck.message);
      return;
    }
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, email, password, image }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      setVerificationSent(data?.verificationSent !== false);
      setDone(true);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "회원가입에 실패했습니다.");
      setLoading(false);
    }
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

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-pale text-2xl">
            ✉️
          </div>
          <h1 className="text-2xl font-extrabold text-ink-main">
            인증 메일을 보냈어요
          </h1>
          <p className="mt-2 text-sm text-ink-sub">
            <span className="font-semibold text-ink-main">{email}</span> 으로
            인증 메일을 보냈어요.
            <br />
            메일의 링크를 눌러 인증을 완료하면 로그인할 수 있어요.
          </p>

          {!verificationSent && (
            <p className="mt-4 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
              메일 발송에 실패했어요. 아래에서 다시 보내주세요.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Button type="button" onClick={handleResend} disabled={resendState !== "idle"}>
              {resendState === "sending"
                ? "보내는 중…"
                : resendState === "sent"
                  ? "다시 보냈어요"
                  : "인증 메일 다시 보내기"}
            </Button>
            <Link
              href="/login"
              className="text-sm font-bold text-plane-dark"
            >
              로그인 화면으로
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-main">회원가입</h1>
        <p className="mt-1 text-sm text-ink-sub">
          창작자 계정을 만들고 이야기를 세계로 보내보세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-sub">
              프로필 사진
            </span>
            <AvatarPicker value={image} name={nickname} onChange={setImage} />
          </div>
          <Field label="닉네임" htmlFor="nickname">
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="창작자 이름"
              required
            />
          </Field>
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
              placeholder={PASSWORD_RULE_HINT}
              required
            />
            <p className="text-xs text-ink-muted">{PASSWORD_RULE_HINT}</p>
          </Field>
          <Field label="비밀번호 확인" htmlFor="passwordConfirm">
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              required
            />
          </Field>

          {error && <p className="text-sm font-medium text-error">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "가입 중…" : "회원가입"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-ink-sub">
          <span className="h-px flex-1 bg-gray-200" />
          간편 회원가입
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <SocialButtons />

        <p className="mt-6 text-center text-sm text-ink-sub">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-plane-dark">
            로그인
          </Link>
        </p>
      </Card>
    </main>
  );
}
