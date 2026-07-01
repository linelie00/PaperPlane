import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CoverImage } from "@/components/ui/CoverImage";
import { SubscribeButton } from "@/components/SubscribeButton";
import { HeartButton } from "@/components/HeartButton";
import { AuthorHomeProfile } from "@/components/AuthorHomeProfile";
import { absoluteUrl, plainExcerpt } from "@/lib/meta";

const LANG_LABEL: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

// 소셜 공유 미리보기 (작가 홈)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ authorId: string }>;
}): Promise<Metadata> {
  const { authorId } = await params;
  const author = await db.user.findUnique({
    where: { id: authorId },
    select: { nickname: true, image: true, coverImage: true, bio: true },
  });
  if (!author) return { title: "작가" };

  const title = `${author.nickname} 작가`;
  const description = plainExcerpt(
    author.bio,
    `${author.nickname} 작가의 공개 작품을 PaperPlane에서 만나보세요.`,
  );
  const image = absoluteUrl(author.coverImage ?? author.image);
  const images = image ? [image] : undefined;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
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

// 공개 작가 홈 — 누구나 접근 가능
export default async function AuthorHomePage({
  params,
}: {
  params: Promise<{ authorId: string }>;
}) {
  const { authorId } = await params;

  const author = await db.user.findUnique({
    where: { id: authorId },
    select: {
      id: true,
      nickname: true,
      image: true,
      coverImage: true,
      bio: true,
      links: { orderBy: { order: "asc" }, select: { id: true, platform: true, url: true } },
      _count: { select: { subscribers: true, authorHeartsReceived: true } },
    },
  });
  if (!author) notFound();

  const currentUser = await getCurrentUser();
  const isSelf = currentUser?.userId === author.id;
  const loginNext = `/author/${author.id}`;

  // 현재 사용자의 구독/하트 상태
  const [mySub, myHeart] = currentUser
    ? await Promise.all([
        db.subscription.findUnique({
          where: {
            subscriberId_authorId: {
              subscriberId: currentUser.userId,
              authorId: author.id,
            },
          },
          select: { id: true },
        }),
        db.authorHeart.findUnique({
          where: {
            userId_authorId: {
              userId: currentUser.userId,
              authorId: author.id,
            },
          },
          select: { id: true },
        }),
      ])
    : [null, null];

  // 공개 작품: isPublic이며 공개·번역완료 회차가 1개 이상
  const works = await db.work.findMany({
    where: {
      authorId,
      isPublic: true,
      chapters: { some: { isPublic: true } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      description: true,
      genre: true,
      sourceLanguage: true,
      targetLanguages: true,
      publicSlug: true,
      coverImage: true,
      _count: {
        select: {
          chapters: { where: { isPublic: true } },
        },
      },
    },
  });

  return (
    <main className="min-h-screen">
      <AuthorHomeProfile
        authorId={author.id}
        nickname={author.nickname}
        image={author.image}
        coverImage={author.coverImage}
        bio={author.bio}
        links={author.links}
        worksCount={works.length}
        subscriberCount={author._count.subscribers}
        editable={isSelf}
        actions={
          !isSelf ? (
            <>
              <SubscribeButton
                authorId={author.id}
                initialSubscribed={!!mySub}
                initialCount={author._count.subscribers}
                isLoggedIn={!!currentUser}
                loginNext={loginNext}
              />
              <HeartButton
                targetType="author"
                targetId={author.id}
                initialHearted={!!myHeart}
                initialCount={author._count.authorHeartsReceived}
                isLoggedIn={!!currentUser}
                loginNext={loginNext}
              />
            </>
          ) : null
        }
      />

      <div className="mx-auto max-w-4xl px-5">
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
                  className="flex flex-col overflow-hidden rounded-2xl border border-paper-border bg-white transition hover:-translate-y-0.5 hover:border-plane-light hover:shadow-plane"
                >
                  <div className="aspect-[16/9] w-full">
                    <CoverImage src={w.coverImage} alt={w.title} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
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
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                      {w.genre && <span>{w.genre}</span>}
                      <span>{LANG_LABEL[w.sourceLanguage] ?? w.sourceLanguage}</span>
                      {w.targetLanguages.length > 0 && (
                        <span>
                          +{" "}
                          {w.targetLanguages
                            .map((l) => LANG_LABEL[l] ?? l)
                            .join(", ")}
                        </span>
                      )}
                    </div>
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
