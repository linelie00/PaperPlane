"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import { CoverPicker } from "@/components/auth/CoverPicker";
import { SnsLinksEditor, type LinkDraft } from "@/components/profile/SnsLinksEditor";
import { AuthorSnsLinks } from "@/components/AuthorSnsLinks";
import { saveProfile } from "@/lib/profileClient";
import type { AuthorLinkItem } from "@/types";

const MAX_BIO = 200;

type Props = {
  authorId: string;
  nickname: string;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  links: AuthorLinkItem[];
  worksCount: number;
  subscriberCount: number;
  editable: boolean; // 본인 홈이면 편집 가능
  actions?: ReactNode; // 비본인: 구독/하트 버튼
};

// 작가 홈 상단(배경+프로필). 본인 홈에서는 '프로필 편집' 토글로 인라인 편집한다.
export function AuthorHomeProfile({
  authorId,
  nickname,
  image,
  coverImage,
  bio,
  links,
  worksCount,
  subscriberCount,
  editable,
  actions,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditView
        initial={{ nickname, image, coverImage, bio, links }}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      {/* 배경 사진 */}
      <div className="relative z-0 h-44 w-full bg-gradient-to-br from-sky-pale to-plane-light/40 sm:h-56">
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5">
        <div className="relative z-10 -mt-12 flex flex-col items-center text-center sm:-mt-14">
          <Avatar
            src={image}
            name={nickname}
            size={96}
            className="border-4 border-white shadow-card"
          />
          <h1 className="mt-3 text-2xl font-extrabold text-ink-main">{nickname}</h1>
          {bio && <p className="mt-2 max-w-xl text-sm text-ink-sub">{bio}</p>}
          <p className="mt-2 text-sm text-ink-muted">
            공개 작품 {worksCount} · 구독자 {subscriberCount}
          </p>

          {editable ? (
            <button
              onClick={() => setEditing(true)}
              className="mt-4 rounded-full border border-plane-light bg-white px-5 py-2 text-sm font-bold text-plane-dark transition hover:bg-sky-pale"
            >
              프로필 편집
            </button>
          ) : (
            actions && <div className="mt-4 flex items-center gap-2">{actions}</div>
          )}

          {links.length > 0 && (
            <div className="mt-4">
              <AuthorSnsLinks links={links} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// 인라인 편집 뷰 (본인 홈)
function EditView({
  initial,
  onClose,
}: {
  initial: {
    nickname: string;
    image: string | null;
    coverImage: string | null;
    bio: string | null;
    links: AuthorLinkItem[];
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initial.nickname);
  const [image, setImage] = useState<string | null>(initial.image);
  const [coverImage, setCoverImage] = useState<string | null>(initial.coverImage);
  const [bio, setBio] = useState(initial.bio ?? "");
  const [links, setLinks] = useState<LinkDraft[]>(
    initial.links.map((l) => ({ platform: l.platform, url: l.url })),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError("");
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    const result = await saveProfile({
      profile: { nickname, image, coverImage, bio },
      links,
    });
    setLoading(false);
    if (result.ok) {
      router.refresh();
      onClose();
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-2xl px-5">
      <div className="flex flex-col gap-5 rounded-4xl border border-paper-border bg-white p-6 shadow-card">
        <h2 className="text-lg font-extrabold text-ink-main">프로필 편집</h2>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">배경 사진</span>
          <CoverPicker value={coverImage} onChange={setCoverImage} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">프로필 사진</span>
          <AvatarPicker value={image} name={nickname} onChange={setImage} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">닉네임</span>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={40}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">소개</span>
          <Textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="작가 홈에 표시될 짧은 소개 (선택)"
            maxLength={MAX_BIO}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">SNS 링크</span>
          <SnsLinksEditor links={links} onChange={setLinks} />
        </div>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-sub hover:text-plane-dark disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-plane-primary to-sky px-6 py-2.5 text-sm font-bold text-white shadow-plane transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
