"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { LanguagePicker } from "@/components/works/LanguagePicker";

type FormState = {
  title: string;
  description: string;
  genre: string;
  tags: string;
  sourceLanguage: string;
  coverImage: string | null;
};

export function EditWorkForm({
  workId,
  initial,
  initialTargetLanguages,
}: {
  workId: string;
  initial: FormState;
  initialTargetLanguages: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(
    initialTargetLanguages,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 번역 언어 구성이 바뀌면 저장 시 모든 회차가 다시 번역된다.
  const willRetranslate =
    form.sourceLanguage !== initial.sourceLanguage ||
    JSON.stringify(targetLanguages) !== JSON.stringify(initialTargetLanguages);

  function update(key: keyof FormState, value: string | null) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function changeSource(value: string) {
    update("sourceLanguage", value);
    setTargetLanguages((prev) => prev.filter((l) => l !== value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("작품 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/works/${workId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        genre: form.genre,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sourceLanguage: form.sourceLanguage,
        targetLanguages,
        coverImage: form.coverImage,
      }),
    });

    if (res.ok) {
      router.push(`/works/${workId}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "수정에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-main">작품 정보 수정</h1>
        <Link
          href={`/works/${workId}`}
          className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          취소
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-sub">
        작품 정보를 수정합니다. 본문은 각 회차에서 수정할 수 있습니다. 번역 언어를
        바꾸면 저장 시 모든 회차가 다시 번역됩니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink-main">1. 작품 정보</h2>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-sub">메인 이미지</span>
            <ImagePicker
              value={form.coverImage}
              onChange={(url) => update("coverImage", url)}
            />
          </div>
          <Field label="작품 제목" htmlFor="title">
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="작품 제목을 입력하세요"
              required
            />
          </Field>
          <Field label="작품 소개" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="작품을 짧게 소개해주세요"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="장르" htmlFor="genre">
              <Input
                id="genre"
                value={form.genre}
                onChange={(e) => update("genre", e.target.value)}
                placeholder="판타지, 로맨스 등"
              />
            </Field>
            <Field label="태그 (쉼표로 구분)" htmlFor="tags">
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                placeholder="romance, fantasy"
              />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink-main">2. 번역 언어</h2>
          <Field label="원문 언어" htmlFor="sourceLanguage">
            <select
              id="sourceLanguage"
              value={form.sourceLanguage}
              onChange={(e) => changeSource(e.target.value)}
              className="w-full rounded-2xl border border-paper-border bg-white px-4 py-3 text-ink-main outline-none focus:border-plane-primary focus:ring-4 focus:ring-plane-light/40"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink-sub">
              번역 대상 언어 (여러 개 선택 가능)
            </span>
            <LanguagePicker
              sourceLanguage={form.sourceLanguage}
              value={targetLanguages}
              onChange={setTargetLanguages}
            />
            <p className="text-xs text-ink-muted">
              언어를 바꾸면 저장 시 모든 회차가 다시 번역됩니다.
            </p>
          </div>
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
              ? willRetranslate
                ? "저장 및 번역 중…"
                : "저장 중…"
              : willRetranslate
                ? "저장하고 다시 번역"
                : "저장하기"}
          </Button>
        </div>
      </form>
    </main>
  );
}
