"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

export default function NewWorkPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    tags: "",
    sourceLanguage: "ko",
    targetLanguage: "en",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("작품 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/works", {
      method: "POST",
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
        targetLanguage: form.targetLanguage,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // 작품 생성 후 상세 페이지로 이동 → 거기서 회차(글)를 추가한다.
      router.push(`/works/${data.workId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "작품 생성에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-main">새 작품 만들기</h1>
        <Link
          href="/works"
          className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          취소
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-sub">
        먼저 작품(프로젝트)을 만들고, 이어서 회차별로 글을 작성합니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="font-bold text-ink-main">1. 작품 정보</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="원문 언어" htmlFor="sourceLanguage">
              <select
                id="sourceLanguage"
                value={form.sourceLanguage}
                onChange={(e) => update("sourceLanguage", e.target.value)}
                className="w-full rounded-2xl border border-paper-border bg-white px-4 py-3 text-ink-main outline-none focus:border-plane-primary focus:ring-4 focus:ring-plane-light/40"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </Field>
            <Field label="번역 대상 언어" htmlFor="targetLanguage">
              <select
                id="targetLanguage"
                value={form.targetLanguage}
                onChange={(e) => update("targetLanguage", e.target.value)}
                className="w-full rounded-2xl border border-paper-border bg-white px-4 py-3 text-ink-main outline-none focus:border-plane-primary focus:ring-4 focus:ring-plane-light/40"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
              </select>
            </Field>
          </div>
          <p className="text-sm text-ink-sub">
            번역 언어는 작품 전체 회차에 적용됩니다. 나중에 작품 정보에서 바꿀 수
            있어요.
          </p>
        </Card>

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "만드는 중…" : "작품 만들고 글 쓰기"}
          </Button>
        </div>
      </form>
    </main>
  );
}
