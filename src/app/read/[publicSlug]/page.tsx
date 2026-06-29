import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CommentSection } from "./CommentSection";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export default async function ReaderListPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      author: { select: { nickname: true } },
      chapters: {
        where: { isPublic: true, translationStatus: "completed" },
        orderBy: { order: "asc" },
        select: { order: true, title: true },
      },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  // 존재하지 않는 publicSlug → 404
  if (!work) notFound();
  // 비공개 작품 또는 공개 회차 없음 → 접근 불가
  if (!work.isPublic || work.chapters.length === 0) {
    return <AccessDenied message="아직 공개된 회차가 없는 작품입니다." />;
  }

  return (
    <main className="mx-auto max-w-[760px] px-5 py-12">
      <p className="text-sm font-semibold text-plane-dark">
        <span className="text-plane-primary">✈</span> PaperPlane ·{" "}
        {LANG_LABEL[work.targetLanguage] ?? work.targetLanguage}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink-main">
        {work.title}
      </h1>
      {work.description && <p className="mt-3 text-ink-sub">{work.description}</p>}
      <p className="mt-2 text-sm text-ink-muted">by {work.author.nickname}</p>

      {/* 회차 목록 */}
      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-ink-main">
          회차 {work.chapters.length}개
        </h2>
        <ul className="mt-4 flex flex-col gap-2">
          {work.chapters.map((ch) => (
            <li key={ch.order}>
              <Link
                href={`/read/${publicSlug}/${ch.order}`}
                className="flex items-center justify-between rounded-2xl border border-paper-border bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-plane-light hover:shadow-plane"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xs font-bold text-plane-dark">
                    {ch.order}화
                  </span>
                  <span className="font-bold text-ink-main">{ch.title}</span>
                </span>
                <span className="text-plane-primary">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CommentSection
        workId={work.id}
        initialComments={work.comments.map((c) => ({
          id: c.id,
          nickname: c.nickname,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="text-5xl opacity-30">✈</p>
      <h1 className="mt-4 text-xl font-bold text-ink-main">{message}</h1>
      <p className="mt-2 text-sm text-ink-sub">
        링크를 다시 확인하거나 창작자에게 문의해주세요.
      </p>
    </main>
  );
}
