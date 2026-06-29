"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ImagePicker } from "@/components/ui/ImagePicker";

type WorkOption = { id: string; title: string; chapterCount: number };
type Mode = "new" | "existing";

const selectClass =
  "w-full rounded-2xl border border-paper-border bg-white px-4 py-3 text-ink-main outline-none focus:border-plane-primary focus:ring-4 focus:ring-plane-light/40";

export function NewWorkChooser({ works }: { works: WorkOption[] }) {
  const hasWorks = works.length > 0;
  // 기존 작품이 있으면 기본값을 "기존 작품에 글쓰기"로 둔다.
  const [mode, setMode] = useState<Mode>(hasWorks ? "existing" : "new");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-main">글쓰기</h1>
        <Link
          href="/works"
          className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          취소
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-sub">
        기존 작품에 새 회차를 추가하거나, 새로운 작품(프로젝트)을 만들 수 있어요.
      </p>

      {/* 모드 선택 */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-sky-pale p-1.5">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            mode === "existing"
              ? "bg-white text-plane-dark shadow-card"
              : "text-ink-sub hover:text-plane-dark"
          }`}
        >
          기존 작품에 글쓰기
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            mode === "new"
              ? "bg-white text-plane-dark shadow-card"
              : "text-ink-sub hover:text-plane-dark"
          }`}
        >
          새 작품 만들기
        </button>
      </div>

      <div className="mt-6">
        {mode === "existing" ? (
          <ExistingWorkPicker works={works} onSwitchToNew={() => setMode("new")} />
        ) : (
          <NewWorkForm />
        )}
      </div>
    </main>
  );
}

// 기존 작품 선택 → 회차 추가 페이지로 이동
function ExistingWorkPicker({
  works,
  onSwitchToNew,
}: {
  works: WorkOption[];
  onSwitchToNew: () => void;
}) {
  const router = useRouter();
  const [workId, setWorkId] = useState(works[0]?.id ?? "");

  if (works.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-3xl opacity-40">📚</p>
        <p className="font-bold text-ink-main">아직 만든 작품이 없어요.</p>
        <p className="text-sm text-ink-sub">
          먼저 새 작품(프로젝트)을 만든 뒤 회차를 작성할 수 있어요.
        </p>
        <Button type="button" onClick={onSwitchToNew} className="mt-2">
          새 작품 만들기
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-bold text-ink-main">기존 작품에 회차 추가</h2>
      <Field label="작품 선택" htmlFor="work">
        <select
          id="work"
          value={workId}
          onChange={(e) => setWorkId(e.target.value)}
          className={selectClass}
        >
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title} ({w.chapterCount}화)
            </option>
          ))}
        </select>
      </Field>
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!workId}
          onClick={() => router.push(`/works/${workId}/chapters/new`)}
        >
          이 작품에 글쓰기
        </Button>
      </div>
    </Card>
  );
}

// 새 작품(프로젝트) 생성 폼 (메타데이터만)
function NewWorkForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    tags: "",
    sourceLanguage: "ko",
    targetLanguage: "en",
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
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
        coverImage,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // 새 작품 생성 후 상세로 이동 → 거기서 회차를 작성한다.
      router.push(`/works/${data.workId}`);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "작품 생성에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <h2 className="font-bold text-ink-main">1. 작품 정보</h2>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink-sub">메인 이미지</span>
          <ImagePicker value={coverImage} onChange={setCoverImage} />
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="원문 언어" htmlFor="sourceLanguage">
            <select
              id="sourceLanguage"
              value={form.sourceLanguage}
              onChange={(e) => update("sourceLanguage", e.target.value)}
              className={selectClass}
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
              className={selectClass}
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
  );
}
