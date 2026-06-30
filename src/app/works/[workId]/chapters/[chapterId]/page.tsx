import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { withLazyImages } from "@/lib/html";
import { langLabel } from "@/lib/lang";
import { TranslationPoller } from "@/components/TranslationPoller";
import { ChapterActions } from "./ChapterActions";

export default async function ChapterViewPage({
  params,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workId, chapterId } = await params;
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { work: true, translations: true },
  });

  if (!chapter || chapter.workId !== workId) notFound();
  if (chapter.work.authorId !== user.userId) redirect("/works");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const langs = chapter.work.targetLanguages;
  // 진행 중인 번역이 있으면 자동 새로고침으로 상태를 갱신한다.
  const translating = langs.some((l) => {
    const t = chapter.translations.find((x) => x.language === l);
    return !t || t.status === "pending" || t.status === "processing";
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <TranslationPoller active={translating} />
      <Link
        href={`/works/${workId}`}
        className="text-sm font-semibold text-ink-sub hover:text-plane-dark"
      >
        ← {chapter.work.title}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-muted">#{chapter.order}</span>
        {chapter.category && (
          <span className="rounded-full bg-plane-primary/10 px-2.5 py-0.5 text-xs font-bold text-plane-dark">
            {chapter.category}
          </span>
        )}
        <h1 className="text-2xl font-extrabold text-ink-main">{chapter.title}</h1>
      </div>

      {/* 상태 + 액션 (다시 번역 / 수정 / 공개) */}
      <Card className="mt-5">
        <ChapterActions
          workId={workId}
          chapterId={chapter.id}
          order={chapter.order}
          initialPublic={chapter.isPublic}
          workIsPublic={chapter.work.isPublic}
          publicSlug={chapter.work.publicSlug}
          appUrl={appUrl}
        />
      </Card>

      {/* 원문 */}
      <Card className="mt-6">
        <h2 className="font-bold text-ink-main">
          원문 · {langLabel(chapter.work.sourceLanguage)}
        </h2>
        <div
          className="rich-content mt-3 text-[15px] text-ink-main"
          dangerouslySetInnerHTML={{
            __html: withLazyImages(chapter.originalText),
          }}
        />
      </Card>

      {/* 언어별 번역문 */}
      {langs.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          이 작품은 번역 대상 언어가 없습니다. 작품 정보 수정에서 추가할 수 있어요.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {langs.map((language) => {
            const t = chapter.translations.find((x) => x.language === language);
            const status = t?.status ?? "pending";
            return (
              <Card key={language}>
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-ink-main">
                    번역 · {langLabel(language)}
                  </h2>
                  <StatusBadge status={status} />
                </div>
                {t?.text ? (
                  <div
                    className="rich-content mt-3 text-[15px] text-ink-main"
                    dangerouslySetInnerHTML={{ __html: withLazyImages(t.text) }}
                  />
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">
                    {status === "failed"
                      ? "번역에 실패했습니다. ‘다시 번역’을 눌러주세요."
                      : "아직 번역 결과가 없습니다."}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
