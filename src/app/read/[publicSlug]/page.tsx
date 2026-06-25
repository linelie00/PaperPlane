import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getClientIp, hashIp } from "@/lib/utils";
import { CommentSection } from "./CommentSection";

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

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { publicSlug } = await params;
  const utm = await searchParams;

  const work = await db.work.findUnique({
    where: { publicSlug },
    include: {
      content: true,
      author: { select: { nickname: true } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });

  // 존재하지 않는 publicSlug → 404
  if (!work) notFound();

  // 비공개 작품 → 접근 불가 메시지
  if (!work.isPublic) {
    return <AccessDenied message="비공개 작품입니다." />;
  }
  // 번역 미완료 → 접근 불가 메시지
  if (work.content?.translationStatus !== "completed") {
    return <AccessDenied message="아직 번역이 준비되지 않은 작품입니다." />;
  }

  // 조회수 1 증가 + 유입 정보 저장 (docs/02_USER_FLOW.md)
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
      <p className="text-sm font-semibold text-plane-dark">
        <span className="text-plane-primary">✈</span> PaperPlane ·{" "}
        {LANG_LABEL[work.targetLanguage] ?? work.targetLanguage}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink-main">
        {work.title}
      </h1>
      {work.description && (
        <p className="mt-3 text-ink-sub">{work.description}</p>
      )}
      <p className="mt-2 text-sm text-ink-muted">by {work.author.nickname}</p>

      {/* 번역 본문 — 가독성 최우선 (docs/08_UI_DESIGN_GUIDE.md) */}
      <article className="mt-8 whitespace-pre-wrap text-[18px] leading-[1.9] text-ink-main">
        {work.content.translatedText}
      </article>

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
