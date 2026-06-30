import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AuthorBadge } from "@/components/AuthorBadge";
import { CoverImage } from "@/components/ui/CoverImage";
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
      coverImage: true,
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
    work.coverImage ??
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
        select: {
          order: true,
          title: true,
          category: true,
          coverImage: true,
          _count: { select: { comments: true } },
        },
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
      {/* 작품 메인 이미지 */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-3xl">
        <CoverImage src={work.coverImage} alt={work.title} />
      </div>
      <p className="mt-6 text-sm font-semibold text-plane-dark">
        <span className="text-plane-primary">✈</span> PaperPlane ·{" "}
        {LANG_LABEL[work.sourceLanguage] ?? work.sourceLanguage}
        {work.targetLanguages.length > 0 && (
          <span className="text-ink-muted">
            {" "}
            (번역:{" "}
            {work.targetLanguages
              .map((l) => LANG_LABEL[l] ?? l)
              .join(", ")}
            )
          </span>
        )}
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
                className="flex items-center gap-4 rounded-2xl border border-paper-border bg-white p-3 transition hover:-translate-y-0.5 hover:border-plane-light hover:shadow-plane"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <CoverImage src={ch.coverImage} alt={ch.title} />
                </div>
                <span className="flex flex-1 items-center gap-2">
                  {ch.category && (
                    <span className="shrink-0 rounded-full bg-plane-primary/10 px-2 py-0.5 text-xs font-bold text-plane-dark">
                      {ch.category}
                    </span>
                  )}
                  <span className="font-bold text-ink-main">{ch.title}</span>
                </span>
                <span className="flex items-center gap-3 pr-2 text-sm text-ink-muted">
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
