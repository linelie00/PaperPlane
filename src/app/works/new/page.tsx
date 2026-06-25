"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

// 태그 제거 후 본문이 비었는지 확인 (HTML 빈 본문 판정)
function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

export default function NewWorkPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    tags: "",
    sourceLanguage: "ko",
    targetLanguage: "en",
    originalText: "",
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
    if (isContentEmpty(form.originalText)) {
      setError("원문 텍스트를 입력해주세요.");
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
        originalText: form.originalText,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/works/${data.workId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "업로드에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-extrabold text-ink-main">작품 업로드</h1>
        <p className="mt-1 text-sm text-ink-sub">
          작품 정보와 원문을 입력하면 AI가 번역본을 생성합니다.
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
            <h2 className="font-bold text-ink-main">2. 원문 텍스트</h2>
            <p className="-mt-2 text-sm text-ink-sub">
              볼드·제목·목록 등 서식과 이미지를 사용할 수 있습니다. 서식은
              번역본에도 그대로 유지됩니다.
            </p>
            <RichTextEditor
              value={form.originalText}
              onChange={(html) => update("originalText", html)}
            />
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="font-bold text-ink-main">3. 번역 언어</h2>
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
          </Card>

          {error && <p className="text-sm font-medium text-error">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "번역 중… (잠시만 기다려주세요)" : "번역 시작하기"}
            </Button>
          </div>
      </form>
    </main>
  );
}
