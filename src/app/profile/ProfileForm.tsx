"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import type { AuthorLinkItem } from "@/types";

const MAX_BIO = 200;
const MAX_LINKS = 8;

type LinkDraft = { platform: string; url: string };

export function ProfileForm({
  email,
  initialNickname,
  initialImage,
  initialCoverImage,
  initialBio,
  initialLinks,
}: {
  email: string;
  initialNickname: string;
  initialImage: string | null;
  initialCoverImage: string | null;
  initialBio: string | null;
  initialLinks: AuthorLinkItem[];
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [image, setImage] = useState<string | null>(initialImage);
  const [coverImage, setCoverImage] = useState<string | null>(initialCoverImage);
  const [bio, setBio] = useState(initialBio ?? "");
  const [links, setLinks] = useState<LinkDraft[]>(
    initialLinks.map((l) => ({ platform: l.platform, url: l.url })),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialLinksJson = JSON.stringify(
    initialLinks.map((l) => ({ platform: l.platform, url: l.url })),
  );
  const linksChanged = JSON.stringify(links) !== initialLinksJson;

  const changed =
    nickname !== initialNickname ||
    image !== initialImage ||
    coverImage !== initialCoverImage ||
    bio !== (initialBio ?? "") ||
    linksChanged;

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

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "저장에 실패했습니다.");
      setLoading(false);
      return;
    }

    // SNS 링크는 별도 엔드포인트로 전체 교체
    if (linksChanged) {
      const cleaned = links.filter((l) => l.url.trim() !== "");
      const linkRes = await fetch("/api/profile/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: cleaned }),
      });
      if (!linkRes.ok) {
        const data = await linkRes.json().catch(() => null);
        setError(data?.error?.message ?? "SNS 링크 저장에 실패했습니다.");
        setLoading(false);
        return;
      }
    }

    setSaved(true);
    router.refresh();
    setLoading(false);
  }

  function updateLink(i: number, patch: Partial<LinkDraft>) {
    setLinks((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  }
  function addLink() {
    if (links.length >= MAX_LINKS) return;
    setLinks((prev) => [...prev, { platform: "", url: "" }]);
  }
  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
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

      {/* SNS 링크 */}
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink-sub">SNS 링크</h2>
          <p className="mt-1 text-xs text-ink-muted">
            작가 홈과 회차 끝에 표시돼요. 독자가 눌러 들어간 클릭 수가 집계됩니다.
          </p>
        </div>

        {links.length > 0 && (
          <ul className="flex flex-col gap-2">
            {links.map((l, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-36 shrink-0">
                  <Input
                    value={l.platform}
                    onChange={(e) => updateLink(i, { platform: e.target.value })}
                    placeholder="플랫폼"
                    maxLength={30}
                  />
                </div>
                <Input
                  value={l.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  placeholder="https://..."
                  inputMode="url"
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-ink-sub hover:text-error"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}

        {links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={addLink}
            className="self-start rounded-full border border-plane-light bg-white px-4 py-1.5 text-sm font-bold text-plane-dark hover:bg-sky-pale"
          >
            + 링크 추가
          </button>
        )}
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
