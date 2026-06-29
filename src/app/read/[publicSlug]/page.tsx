import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AuthorBadge } from "@/components/AuthorBadge";
import { absoluteUrl, firstImageSrc, plainExcerpt } from "@/lib/meta";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

// 소셜 공유 미리보기 (Open Graph / Twitter Card)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}): Promise<Metadata> {
  const { publicSlug } = await params;
  const work = await db.work.findUnique({
    where: { publicSlug },
    select: {
      title: true,
      description: true,
      isPublic: true,
      author: { select: { nickname: true, image: true, coverImage: true } },
      chapters: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
        take: 1,
        select: { originalText: true },
      },
    },
  });

  if (!work || !work.isPublic || work.chapters.length === 0) {
    return { title: "작품" };
  }

  const description = plainExcerpt(
    work.description,
    `${work.author.nickname}의 작품을 PaperPlane에서 읽어보세요.`,
  );
  const image = absoluteUrl(
    firstImageSrc(work.chapters[0]?.originalText) ??
      work.author.coverImage ??
      work.author.image,
  );
  const images = image ? [image] : undefined;

  return {
    title: work.title,
    description,
    openGraph: {
      type: "article",
      title: work.title,
      description,
      authors: [work.author.nickname],
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: work.title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

export default async function ReaderListPage({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}) {
  const { publicSlug } = await params;

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      author: { select: { id: true, nickname: true, image: true } },
      chapters: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
        select: { order: true, title: true, _count: { select: { comments: true } } },
      },
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
      <div className="mt-3">
        <AuthorBadge
          authorId={work.author.id}
          nickname={work.author.nickname}
          image={work.author.image}
        />
      </div>

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
                <span className="flex items-center gap-3 text-sm text-ink-muted">
                  {ch._count.comments > 0 && (
                    <span>댓글 {ch._count.comments}</span>
                  )}
                  <span className="text-plane-primary">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
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
