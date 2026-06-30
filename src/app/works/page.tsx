import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

function langLabel(code: string) {
  return LANG_LABEL[code] ?? code;
}

export default async function WorksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const works = await db.work.findMany({
    where: { authorId: user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      chapters: { select: { isPublic: true } },
      _count: { select: { comments: true, viewLogs: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink-main">내 작품</h1>
        <LinkButton href="/works/new">글쓰기</LinkButton>
      </div>

        {works.length === 0 ? (
          <Card className="mt-8 text-center">
            <p className="text-ink-sub">아직 업로드한 작품이 없습니다.</p>
            <div className="mt-4 flex justify-center">
              <LinkButton href="/works/new">첫 작품을 업로드해 보세요</LinkButton>
            </div>
          </Card>
        ) : (
          <div className="mt-8 grid gap-4">
            {works.map((w) => (
              <Link key={w.id} href={`/works/${w.id}`}>
                <Card className="flex items-start gap-4 transition hover:-translate-y-0.5 hover:shadow-plane">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <CoverImage src={w.coverImage} alt={w.title} />
                  </div>
                  <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-ink-main">
                          {w.title}
                        </h2>
                        <span className="rounded-full bg-sky-pale px-2.5 py-0.5 text-xs font-semibold text-plane-dark">
                          {w.chapters.length}화
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-sub">
                        {langLabel(w.sourceLanguage)}
                        {w.targetLanguages.length > 0 &&
                          ` → ${w.targetLanguages.map(langLabel).join(", ")}`}{" "}
                        ·{" "}
                        {w.isPublic ? (
                          <span className="text-plane-dark">
                            공개 (회차 {w.chapters.filter((c) => c.isPublic).length}
                            개)
                          </span>
                        ) : (
                          <span className="text-ink-muted">비공개</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm text-ink-sub">
                      <span>조회 {w._count.viewLogs}</span>
                      <span>댓글 {w._count.comments}</span>
                      <span className="text-ink-muted">
                        {w.createdAt.toISOString().slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
      )}
    </main>
  );
}
