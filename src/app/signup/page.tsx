"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, email, password }),
    });

    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "회원가입에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-main">회원가입</h1>
        <p className="mt-1 text-sm text-ink-sub">
          창작자 계정을 만들고 이야기를 세계로 보내보세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
              placeholder="8자 이상"
              required
            />
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

        <p className="mt-5 text-center text-sm text-ink-sub">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-bold text-plane-dark">
            로그인
          </Link>
        </p>
      </Card>
    </main>
  );
}
