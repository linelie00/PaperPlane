"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import { CoverPicker } from "@/components/auth/CoverPicker";
import { SnsLinksEditor, type LinkDraft } from "@/components/profile/SnsLinksEditor";
import { saveProfile } from "@/lib/profileClient";
import type { AuthorLinkItem } from "@/types";

const MAX_BIO = 200;

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
    const result = await saveProfile({
      profile: { nickname, image, coverImage, bio },
      links: linksChanged ? links : undefined,
    });
    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.message);
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

      {/* SNS 링크 */}
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink-sub">SNS 링크</h2>
          <p className="mt-1 text-xs text-ink-muted">
            작가 홈과 회차 끝에 표시돼요. 독자가 눌러 들어간 클릭 수가 집계됩니다.
          </p>
        </div>
        <SnsLinksEditor links={links} onChange={setLinks} />
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
