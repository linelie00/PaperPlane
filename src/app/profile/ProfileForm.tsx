"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { AvatarPicker } from "@/components/auth/AvatarPicker";

export function ProfileForm({
  email,
  initialNickname,
  initialImage,
}: {
  email: string;
  initialNickname: string;
  initialImage: string | null;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [image, setImage] = useState<string | null>(initialImage);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const changed = nickname !== initialNickname || image !== initialImage;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, image }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh(); // 헤더 등 세션 기반 표시 갱신
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "저장에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">프로필 사진</span>
          <AvatarPicker value={image} name={nickname} onChange={setImage} />
        </div>

        <Field label="닉네임" htmlFor="nickname">
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={40}
            required
          />
        </Field>

        <Field label="이메일" htmlFor="email">
          <Input id="email" value={email} disabled readOnly />
        </Field>
        <p className="-mt-2 text-xs text-ink-muted">
          이메일은 변경할 수 없습니다.
        </p>
      </Card>

      {error && <p className="text-sm font-medium text-error">{error}</p>}
      {saved && (
        <p className="text-sm font-medium text-plane-dark">
          저장되었습니다.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !changed}>
          {loading ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
