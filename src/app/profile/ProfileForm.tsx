"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { AvatarPicker } from "@/components/auth/AvatarPicker";

const MAX_BIO = 200;

export function ProfileForm({
  email,
  initialNickname,
  initialImage,
  initialCoverImage,
  initialBio,
}: {
  email: string;
  initialNickname: string;
  initialImage: string | null;
  initialCoverImage: string | null;
  initialBio: string | null;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [image, setImage] = useState<string | null>(initialImage);
  const [coverImage, setCoverImage] = useState<string | null>(initialCoverImage);
  const [bio, setBio] = useState(initialBio ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const changed =
    nickname !== initialNickname ||
    image !== initialImage ||
    coverImage !== initialCoverImage ||
    bio !== (initialBio ?? "");

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
      body: JSON.stringify({ nickname, image, coverImage, bio }),
    });

    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "저장에 실패했습니다.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        {/* 배경 사진 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">배경 사진</span>
          <CoverPicker value={coverImage} onChange={setCoverImage} />
        </div>

        {/* 프로필 사진 */}
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

        <Field label="소개" htmlFor="bio">
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="작가 홈에 표시될 짧은 소개 (선택)"
            maxLength={MAX_BIO}
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
        <p className="text-sm font-medium text-plane-dark">저장되었습니다.</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !changed}>
          {loading ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}

// 배경(배너) 이미지 업로더 — /api/avatar 재사용
function CoverPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) onChange(data.url);
      else setError(data?.error?.message ?? "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-paper-border bg-gradient-to-br from-sky-pale to-plane-light/30">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="배경" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : value ? "배경 변경" : "배경 선택"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-error"
          >
            제거
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-error">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
