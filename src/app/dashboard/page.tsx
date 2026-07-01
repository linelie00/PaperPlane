import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/analytics";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getDashboardStats(user.userId);

  return (
    <div className="min-h-screen">
      <Header nickname={user.nickname} image={user.image} />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-main">대시보드</h1>
            <p className="mt-1 text-sm text-ink-sub">
              {user.nickname} 님의 작품과 독자 반응을 한눈에 확인하세요.
            </p>
          </div>
          <LinkButton href="/works/new">새 작품 업로드</LinkButton>
        </div>

        {/* 상단 요약 카드 */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard label="전체 작품 수" value={stats.totalWorks} />
          <SummaryCard label="전체 조회수" value={stats.totalViews} />
          <SummaryCard label="오늘 조회수" value={stats.todayViews} />
          <SummaryCard label="전체 댓글 수" value={stats.totalComments} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* 작품별 조회수 요약 */}
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-bold text-ink-main">작품별 요약</h2>
            {stats.works.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-paper-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sky-pale text-ink-sub">
                    <tr>
                      <th className="px-4 py-3 font-semibold">작품</th>
                      <th className="px-4 py-3 font-semibold">조회수</th>
                      <th className="px-4 py-3 font-semibold">댓글</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.works.map((w) => (
                      <tr
                        key={w.workId}
                        className="border-t border-paper-border"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/works/${w.workId}`}
                            className="font-semibold text-ink-main hover:text-plane-dark"
                          >
                            {w.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-sub">{w.viewCount}</td>
                        <td className="px-4 py-3 text-ink-sub">
                          {w.commentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="flex flex-col gap-6">
            {/* 주요 유입 경로 */}
            <Card>
              <h2 className="text-lg font-bold text-ink-main">주요 유입 경로</h2>
              {stats.referrers.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  아직 유입 기록이 없습니다.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {stats.referrers.map((r) => (
                    <li
                      key={r.source}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-ink-sub">{r.source}</span>
                      <span className="font-bold text-ink-main">{r.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* SNS 클릭 요약 */}
            <Card>
              <h2 className="text-lg font-bold text-ink-main">
                SNS 클릭 {stats.totalSnsClicks > 0 && `(${stats.totalSnsClicks})`}
              </h2>
              {stats.snsClicks.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  프로필에서 SNS 링크를 추가하면 클릭 수가 집계돼요.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {stats.snsClicks.map((l) => (
                    <li
                      key={l.url}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-ink-sub">{l.platform}</span>
                      <span className="font-bold text-ink-main">{l.clicks}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* 최근 댓글 */}
            <Card>
              <h2 className="text-lg font-bold text-ink-main">최근 댓글</h2>
              {stats.recentComments.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  아직 댓글이 없습니다.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {stats.recentComments.slice(0, 5).map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-semibold text-ink-main">
                        {c.nickname}
                      </span>
                      <p className="text-ink-sub">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink-main">
        {value.toLocaleString()}
      </p>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-2xl bg-sky-pale p-8 text-center">
      <p className="text-ink-sub">아직 업로드한 작품이 없습니다.</p>
      <div className="mt-4 flex justify-center">
        <LinkButton href="/works/new">첫 작품을 업로드해 보세요</LinkButton>
      </div>
    </div>
  );
}
