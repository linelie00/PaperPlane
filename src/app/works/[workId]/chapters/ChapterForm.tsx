"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

type Props = {
  workId: string;
  mode: "create" | "edit";
  chapterId?: string;
  initialTitle: string;
  initialText: string;
  initialPublic: boolean;
  initialCover: string | null;
};

export function ChapterForm({
  workId,
  mode,
  chapterId,
  initialTitle,
  initialText,
  initialPublic,
  initialCover,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [originalText, setOriginalText] = useState(initialText);
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [coverImage, setCoverImage] = useState<string | null>(initialCover);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const contentChanged = mode === "edit" && originalText !== initialText;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (isContentEmpty(originalText)) {
      setError("원문 텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);
    const url =
      mode === "create"
        ? `/api/works/${workId}/chapters`
        : `/api/chapters/${chapterId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, originalText, isPublic, coverImage }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      // 저장 후 회차 보기(원문/번역문 비교) 페이지로 이동한다.
      const id = mode === "create" ? data?.chapterId : chapterId;
      router.push(id ? `/works/${workId}/chapters/${id}` : `/works/${workId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "저장에 실패했습니다.");
      setLoading(false);
    }
  }

  // 번역을 새로 돌리는 경우 버튼 문구 안내
  const willTranslate = mode === "create" || contentChanged;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-main">
          {mode === "create" ? "회차 추가" : "회차 수정"}
        </h1>
        <Link
          href={`/works/${workId}`}
          className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          취소
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-sub">
        회차 본문을 입력하면 AI가 번역본을 생성합니다. 서식과 이미지를 사용할 수
        있습니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <Field label="회차 제목" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 1화: 시작"
            />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-sub">
              회차 메인 이미지
            </span>
            <ImagePicker value={coverImage} onChange={setCoverImage} />
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink-main">본문</h2>
          <RichTextEditor value={originalText} onChange={setOriginalText} />
        </Card>

        <Card className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-ink-main">회차 공개</p>
            <p className="mt-1 text-sm text-ink-sub">
              켜면 번역 완료 후 이 회차를 독자가 읽을 수 있습니다. (작품도 공개
              상태여야 노출됩니다)
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic((v) => !v)}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
              isPublic ? "bg-plane-primary" : "bg-paper-border"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                isPublic ? "left-6" : "left-1"
              }`}
            />
          </button>
        </Card>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link
            href={`/works/${workId}`}
            className="inline-flex items-center rounded-full border border-paper-border px-6 py-3 text-sm font-bold text-ink-sub hover:bg-sky-pale"
          >
            취소
          </Link>
          <Button type="submit" disabled={loading}>
            {loading
              ? willTranslate
                ? "저장 및 번역 중…"
                : "저장 중…"
              : willTranslate
                ? mode === "create"
                  ? "추가하고 번역"
                  : "저장하고 다시 번역"
                : "저장하기"}
          </Button>
        </div>
      </form>
    </main>
  );
}
