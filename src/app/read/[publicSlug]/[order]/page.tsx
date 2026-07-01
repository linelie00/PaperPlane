import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, hashIp } from "@/lib/utils";
import { getChapterCommentTree } from "@/lib/comments";
import { withLazyImages } from "@/lib/html";
import { absoluteUrl, firstImageSrc, plainExcerpt } from "@/lib/meta";
import { CommentSection } from "../CommentSection";
import { ChapterContent } from "../ChapterContent";
import { AuthorBadge } from "@/components/AuthorBadge";
import { AuthorSnsLinks } from "@/components/AuthorSnsLinks";
import { ShareButton } from "@/components/ShareButton";

// 소셜 공유 미리보기 (회차 단위)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicSlug: string; order: string }>;
}): Promise<Metadata> {
  const { publicSlug, order } = await params;
  const work = await db.work.findUnique({
    where: { publicSlug },
    select: {
      title: true,
      isPublic: true,
      coverImage: true,
      author: { select: { nickname: true, image: true, coverImage: true } },
      chapters: {
        where: { isPublic: true, order: Number(order) },
        take: 1,
        select: { title: true, originalText: true, coverImage: true },
      },
    },
  });

  const chapter = work?.chapters[0];
  if (!work || !work.isPublic || !chapter) {
    return { title: "회차" };
  }

  const title = `${chapter.title} - ${work.title}`;
  const description = plainExcerpt(
    chapter.originalText,
    `${work.author.nickname}의 작품 「${work.title}」을 PaperPlane에서 읽어보세요.`,
  );
  const image = absoluteUrl(
    chapter.coverImage ??
      firstImageSrc(chapter.originalText) ??
      work.coverImage ??
      work.author.coverImage ??
      work.author.image,
  );
  const images = image ? [image] : undefined;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      authors: [work.author.nickname],
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

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
      author: {
        select: {
          id: true,
          nickname: true,
          image: true,
          links: {
            orderBy: { order: "asc" },
            select: { id: true, platform: true, url: true },
          },
        },
      },
      chapters: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
        include: {
          translations: {
            where: { status: "completed", text: { not: null } },
          },
        },
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
  const currentUser = await getCurrentUser();

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
      <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-plane-dark">
        <span className="text-plane-primary">✈</span>
        {chapter.category ? (
          <span className="rounded-full bg-plane-primary/10 px-2 py-0.5 text-xs">
            {chapter.category}
          </span>
        ) : null}
        <span>{LANG_LABEL[work.sourceLanguage] ?? work.sourceLanguage}</span>
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ink-main">
        {chapter.title}
      </h1>
      <div className="mt-2 flex items-center justify-between gap-3">
        <AuthorBadge
          authorId={work.author.id}
          nickname={work.author.nickname}
          image={work.author.image}
        />
        <ShareButton />
      </div>

      {/* 원문 우선, 번역이 있으면 언어 버튼으로 전환 가능 */}
      <ChapterContent
        original={withLazyImages(chapter.originalText)}
        sourceLanguage={work.sourceLanguage}
        translations={work.targetLanguages
          .map((language) => {
            const t = chapter.translations.find((x) => x.language === language);
            return t?.text
              ? { language, html: withLazyImages(t.text) }
              : null;
          })
          .filter((x): x is { language: string; html: string } => x !== null)}
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

      {/* 작품을 다 읽은 뒤 작가 SNS로 이동 (클릭 추적) */}
      {work.author.links.length > 0 && (
        <section className="mt-10 rounded-3xl border border-paper-border bg-white p-6 text-center shadow-card">
          <p className="text-sm font-semibold text-ink-main">
            {work.author.nickname} 작가를 더 만나보세요
          </p>
          <div className="mt-3">
            <AuthorSnsLinks links={work.author.links} />
          </div>
        </section>
      )}

      <CommentSection
        chapterId={chapter.id}
        initialComments={comments}
        currentUser={
          currentUser
            ? {
                userId: currentUser.userId,
                nickname: currentUser.nickname,
                image: currentUser.image,
              }
            : null
        }
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
