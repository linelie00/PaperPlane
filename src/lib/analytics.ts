import { db } from "@/lib/db";
import type { DashboardStats } from "@/types";

// 창작자 대시보드 통계를 집계한다. (docs/04_API_SPEC.md)
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const works = await db.work.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { viewLogs: true, comments: true } },
    },
  });

  const workIds = works.map((w) => w.id);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalViews, todayViews, totalComments, viewLogs, recentComments] =
    await Promise.all([
      db.viewLog.count({ where: { workId: { in: workIds } } }),
      db.viewLog.count({
        where: { workId: { in: workIds }, createdAt: { gte: startOfToday } },
      }),
      db.comment.count({ where: { workId: { in: workIds } } }),
      db.viewLog.findMany({
        where: { workId: { in: workIds } },
        select: { referrer: true, utmSource: true },
      }),
      db.comment.findMany({
        where: { workId: { in: workIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // 주요 유입 경로 집계 (utmSource 우선, 없으면 referrer 호스트)
  const referrerCounts = new Map<string, number>();
  for (const log of viewLogs) {
    let source = log.utmSource;
    if (!source && log.referrer) {
      try {
        source = new URL(log.referrer).hostname;
      } catch {
        source = log.referrer;
      }
    }
    if (!source) source = "direct";
    referrerCounts.set(source, (referrerCounts.get(source) ?? 0) + 1);
  }

  const referrers = Array.from(referrerCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalWorks: works.length,
    totalViews,
    todayViews,
    totalComments,
    publicWorks: works.filter((w) => w.isPublic).length,
    works: works.map((w) => ({
      workId: w.id,
      title: w.title,
      viewCount: w._count.viewLogs,
      commentCount: w._count.comments,
    })),
    referrers,
    recentComments: recentComments.map((c) => ({
      id: c.id,
      workId: c.workId,
      nickname: c.nickname,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}
