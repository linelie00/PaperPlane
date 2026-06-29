import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/utils";
import { getChapterCommentTree } from "@/lib/comments";
import { withLazyImages } from "@/lib/html";
import { CommentSection } from "../CommentSection";
import { AuthorBadge } from "@/components/AuthorBadge";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

type SearchParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export default async function ChapterReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicSlug: string; order: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { publicSlug, order } = await params;
  const utm = await searchParams;
  const orderNum = Number(order);

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      author: { select: { id: true, nickname: true, image: true } },
      chapters: {
        where: { isPublic: true, translationStatus: "completed" },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!work) notFound();
  if (!work.isPublic) {
    return <AccessDenied message="비공개 작품입니다." />;
  }

  const publicChapters = work.chapters;
  const idx = publicChapters.findIndex((c) => c.order === orderNum);
  if (idx === -1) {
    return <AccessDenied message="아직 공개되지 않은 회차입니다." />;
  }
  const chapter = publicChapters[idx];
  const prev = publicChapters[idx - 1];
  const next = publicChapters[idx + 1];

  const comments = await getChapterCommentTree(chapter.id);

  // 조회수 1 증가 + 유입 정보 저장 (작품 단위, docs/02_USER_FLOW.md)
  const headerList = await headers();
  await db.viewLog.create({
    data: {
      workId: work.id,
      referrer: headerList.get("referer"),
      utmSource: utm.utm_source ?? null,
      utmMedium: utm.utm_medium ?? null,
      utmCampaign: utm.utm_campaign ?? null,
      userAgent: headerList.get("user-agent"),
      ipHash: hashIp(getClientIp(headerList)),
    },
  });

  return (
    <main className="mx-auto max-w-[760px] px-5 py-12">
      <Link
        href={`/read/${publicSlug}`}
        className="text-sm font-semibold text-plane-dark hover:underline"
      >
        ← {work.title}
      </Link>
      <p className="mt-4 text-sm font-semibold text-plane-dark">
        <span className="text-plane-primary">✈</span>{" "}
        {LANG_LABEL[work.targetLanguage] ?? work.targetLanguage} · {chapter.order}화
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ink-main">
        {chapter.title}
      </h1>
      <div className="mt-2">
        <AuthorBadge
          authorId={work.author.id}
          nickname={work.author.nickname}
          image={work.author.image}
        />
      </div>

      {/* 번역 본문 — 저장 시점에 sanitize된 HTML이므로 렌더는 안전하다. */}
      <article
        className="rich-content mt-8 text-[18px] text-ink-main"
        dangerouslySetInnerHTML={{
          __html: withLazyImages(chapter.translatedText ?? ""),
        }}
      />

      {/* 이전/다음 회차 네비게이션 */}
      <nav className="mt-12 flex items-center justify-between gap-3 border-t border-paper-border pt-6">
        {prev ? (
          <Link
            href={`/read/${publicSlug}/${prev.order}`}
            className="rounded-full border border-plane-light px-5 py-2.5 text-sm font-bold text-plane-dark hover:bg-sky-pale"
          >
            ← {prev.order}화
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/read/${publicSlug}`}
          className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
        >
          목록
        </Link>
        {next ? (
          <Link
            href={`/read/${publicSlug}/${next.order}`}
            className="rounded-full bg-gradient-to-r from-plane-primary to-sky px-5 py-2.5 text-sm font-bold text-white shadow-plane hover:-translate-y-0.5"
          >
            {next.order}화 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <CommentSection chapterId={chapter.id} initialComments={comments} />
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
