import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CoverImage } from "@/components/ui/CoverImage";
import { Avatar } from "@/components/ui/Avatar";
import { getCurrentUser } from "@/lib/auth";
import { getReaderFeed } from "@/lib/feed";

export const metadata = { title: "피드" };

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/feed");

  const { subscribedCount, items } = await getReaderFeed(user.userId);

  return (
    <div className="min-h-screen">
      <Header nickname={user.nickname} image={user.image} />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-extrabold text-ink-main">피드</h1>
        <p className="mt-1 text-sm text-ink-sub">
          {subscribedCount > 0
            ? `구독한 작가 ${subscribedCount}명의 새 소식과 추천 작품이에요.`
            : "관심 있는 작가를 구독하면 이곳에 새 작품이 모여요. 먼저 인기 작품을 둘러보세요."}
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-sky-pale p-10 text-center">
            <p className="text-ink-sub">아직 공개된 작품이 없어요.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.workId}
                className="flex flex-col overflow-hidden rounded-2xl border border-paper-border bg-white transition hover:-translate-y-0.5 hover:border-plane-light hover:shadow-plane"
              >
                <Link href={`/read/${it.publicSlug}`}>
                  <div className="aspect-[16/9] w-full">
                    <CoverImage src={it.coverImage} alt={it.title} />
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/read/${it.publicSlug}`}
                      className="font-bold text-ink-main hover:text-plane-dark"
                    >
                      {it.title}
                    </Link>
                    {it.subscribed && (
                      <span className="shrink-0 rounded-full bg-plane-primary/10 px-2 py-0.5 text-xs font-bold text-plane-dark">
                        구독
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/author/${it.authorId}`}
                    className="mt-2 flex items-center gap-2 text-sm text-ink-sub hover:text-plane-dark"
                  >
                    <Avatar src={it.authorImage} name={it.authorNickname} size={20} />
                    {it.authorNickname}
                  </Link>
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                    <span>조회 {it.viewCount}</span>
                    <span>❤️ {it.heartCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
