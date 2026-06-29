import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/Avatar";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

// 공개 작가 홈 — 누구나 접근 가능
export default async function AuthorHomePage({
  params,
}: {
  params: Promise<{ authorId: string }>;
}) {
  const { authorId } = await params;

  const author = await db.user.findUnique({
    where: { id: authorId },
    select: { id: true, nickname: true, image: true, coverImage: true, bio: true },
  });
  if (!author) notFound();

  // 공개 작품: isPublic이며 공개·번역완료 회차가 1개 이상
  const works = await db.work.findMany({
    where: {
      authorId,
      isPublic: true,
      chapters: { some: { isPublic: true, translationStatus: "completed" } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      description: true,
      genre: true,
      targetLanguage: true,
      publicSlug: true,
      _count: {
        select: {
          chapters: { where: { isPublic: true, translationStatus: "completed" } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen">
      {/* 배경 사진 */}
      <div className="relative h-44 w-full bg-gradient-to-br from-sky-pale to-plane-light/40 sm:h-56">
        {author.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-5">
        {/* 프로필 헤더 */}
        <div className="-mt-12 flex flex-col items-center text-center sm:-mt-14">
          <Avatar
            src={author.image}
            name={author.nickname}
            size={96}
            className="border-4 border-white shadow-card"
          />
          <h1 className="mt-3 text-2xl font-extrabold text-ink-main">
            {author.nickname}
          </h1>
          {author.bio && (
            <p className="mt-2 max-w-xl text-sm text-ink-sub">{author.bio}</p>
          )}
          <p className="mt-2 text-sm text-ink-muted">공개 작품 {works.length}</p>
        </div>

        {/* 공개 작품 목록 */}
        <section className="mt-10 pb-16">
          <h2 className="text-lg font-extrabold text-ink-main">공개 작품</h2>
          {works.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              아직 공개된 작품이 없습니다.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {works.map((w) => (
                <Link
                  key={w.publicSlug}
                  href={`/read/${w.publicSlug}`}
                  className="flex flex-col rounded-2xl border border-paper-border bg-white p-5 transition hover:-translate-y-0.5 hover:border-plane-light hover:shadow-plane"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-ink-main">{w.title}</h3>
                    <span className="rounded-full bg-sky-pale px-2 py-0.5 text-xs font-semibold text-plane-dark">
                      {w._count.chapters}화
                    </span>
                  </div>
                  {w.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-sub">
                      {w.description}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2 text-xs text-ink-muted">
                    {w.genre && <span>{w.genre}</span>}
                    <span>
                      {LANG_LABEL[w.targetLanguage] ?? w.targetLanguage}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
