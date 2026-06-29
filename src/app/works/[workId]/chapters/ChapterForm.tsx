"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
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
};

export function ChapterForm({
  workId,
  mode,
  chapterId,
  initialTitle,
  initialText,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [originalText, setOriginalText] = useState(initialText);
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
      body: JSON.stringify({ title, originalText }),
    });

    if (res.ok) {
      router.push(`/works/${workId}`);
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
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink-main">본문</h2>
          <RichTextEditor value={originalText} onChange={setOriginalText} />
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
