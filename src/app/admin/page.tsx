import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getAdminStats } from "@/lib/admin-stats";

export const metadata = { title: "관리자" };

// 개발자용 대시보드 — ADMIN_EMAILS 허용목록만 접근 가능
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) notFound();

  const stats = await getAdminStats();
  const clickRate =
    stats.totalViews > 0
      ? ((stats.totalLinkClicks / stats.totalViews) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="min-h-screen">
      <Header nickname={user.nickname} image={user.image} />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-2xl font-extrabold text-ink-main">개발자 대시보드</h1>
        <p className="mt-1 text-sm text-ink-sub">
          서비스 전체 지표와 SNS 클릭률을 확인합니다.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="전체 사용자" value={stats.totalUsers} />
          <SummaryCard label="신규 가입(7일)" value={stats.newUsers7d} />
          <SummaryCard label="전체 작품" value={stats.totalWorks} />
          <SummaryCard label="전체 조회수" value={stats.totalViews} />
          <SummaryCard label="전체 댓글" value={stats.totalComments} />
          <SummaryCard label="구독 수" value={stats.totalSubscriptions} />
          <SummaryCard label="하트 수" value={stats.totalHearts} />
          <SummaryCard label="SNS 클릭 수" value={stats.totalLinkClicks} />
          <SummaryCard label="SNS 클릭률" value={`${clickRate}%`} />
        </div>

        {/* 창작자별 리더보드 */}
        <Card className="mt-8">
          <h2 className="text-lg font-bold text-ink-main">창작자 리더보드 (조회순)</h2>
          {stats.creators.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">창작자가 없습니다.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-paper-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-sky-pale text-ink-sub">
                  <tr>
                    <th className="px-4 py-3 font-semibold">작가</th>
                    <th className="px-4 py-3 font-semibold">작품</th>
                    <th className="px-4 py-3 font-semibold">조회</th>
                    <th className="px-4 py-3 font-semibold">구독자</th>
                    <th className="px-4 py-3 font-semibold">하트</th>
                    <th className="px-4 py-3 font-semibold">댓글</th>
                    <th className="px-4 py-3 font-semibold">SNS 클릭</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.creators.map((c) => (
                    <tr key={c.authorId} className="border-t border-paper-border">
                      <td className="px-4 py-3 font-semibold text-ink-main">
                        {c.nickname}
                      </td>
                      <td className="px-4 py-3 text-ink-sub">{c.workCount}</td>
                      <td className="px-4 py-3 text-ink-sub">{c.viewCount}</td>
                      <td className="px-4 py-3 text-ink-sub">{c.subscriberCount}</td>
                      <td className="px-4 py-3 text-ink-sub">{c.heartCount}</td>
                      <td className="px-4 py-3 text-ink-sub">{c.commentCount}</td>
                      <td className="px-4 py-3 font-bold text-ink-main">{c.snsClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* 인기 작품 랭킹 */}
          <Card>
            <h2 className="text-lg font-bold text-ink-main">인기 작품 (조회순)</h2>
            {stats.topWorks.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">작품이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats.topWorks.map((w, i) => (
                  <li
                    key={w.workId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-ink-sub">
                      <span className="mr-2 font-bold text-ink-muted">{i + 1}</span>
                      {w.publicSlug ? (
                        <Link
                          href={`/read/${w.publicSlug}`}
                          className="font-semibold text-ink-main hover:text-plane-dark"
                        >
                          {w.title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink-main">{w.title}</span>
                      )}
                      <span className="ml-1 text-ink-muted">· {w.authorNickname}</span>
                    </span>
                    <span className="shrink-0 text-ink-muted">
                      조회 {w.viewCount} · ❤️ {w.heartCount} · 💬 {w.commentCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 활발한 독자 */}
          <Card>
            <h2 className="text-lg font-bold text-ink-main">활발한 독자</h2>
            {stats.topReaders.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">독자 활동이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats.topReaders.map((r, i) => (
                  <li
                    key={r.userId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-ink-main">
                      <span className="mr-2 font-bold text-ink-muted">{i + 1}</span>
                      {r.nickname}
                    </span>
                    <span className="shrink-0 text-ink-muted">
                      구독 {r.subscriptions} · ❤️ {r.hearts} · 💬 {r.comments}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* 상위 SNS 링크 */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-bold text-ink-main">상위 SNS 링크</h2>
            {stats.topLinks.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">아직 클릭 기록이 없습니다.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-paper-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sky-pale text-ink-sub">
                    <tr>
                      <th className="px-4 py-3 font-semibold">작가</th>
                      <th className="px-4 py-3 font-semibold">플랫폼</th>
                      <th className="px-4 py-3 font-semibold">URL</th>
                      <th className="px-4 py-3 font-semibold">클릭</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topLinks.map((l) => (
                      <tr key={l.linkId} className="border-t border-paper-border">
                        <td className="px-4 py-3 text-ink-main">{l.authorNickname}</td>
                        <td className="px-4 py-3 text-ink-sub">{l.platform}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-ink-muted">
                          {l.url}
                        </td>
                        <td className="px-4 py-3 font-bold text-ink-main">{l.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 플랫폼별 클릭 */}
          <Card>
            <h2 className="text-lg font-bold text-ink-main">플랫폼별 클릭</h2>
            {stats.platforms.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">기록이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats.platforms.map((p) => (
                  <li
                    key={p.platform}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-sub">{p.platform}</span>
                    <span className="font-bold text-ink-main">{p.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink-main">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </Card>
  );
}
