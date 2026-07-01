import { db } from "@/lib/db";
import type { AdminStats } from "@/types";

// 개발자(관리자) 대시보드 통계를 집계한다.
// 전역 합계 + 창작자별 리더보드 + 인기 작품 + 활발한 독자 + SNS 클릭률.
export async function getAdminStats(): Promise<AdminStats> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    totalUsers,
    totalWorks,
    totalViews,
    totalComments,
    totalSubscriptions,
    authorHearts,
    workHearts,
    totalLinkClicks,
    newUsers7d,
    users,
    works,
    links,
    subsByAuthor,
    authorHeartByAuthor,
    subsByReader,
    authorHeartByUser,
    workHeartByUser,
    commentByUser,
    topWorksRaw,
  ] = await Promise.all([
    db.user.count(),
    db.work.count(),
    db.viewLog.count(),
    db.comment.count(),
    db.subscription.count(),
    db.authorHeart.count(),
    db.workHeart.count(),
    db.linkClick.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.findMany({ select: { id: true, nickname: true } }),
    // 작품별 작가/카운트 — 작가별 합산 원천
    db.work.findMany({
      select: {
        authorId: true,
        _count: { select: { viewLogs: true, comments: true, hearts: true } },
      },
    }),
    // SNS 링크 (플랫폼/작가/클릭)
    db.authorLink.findMany({
      select: {
        id: true,
        platform: true,
        url: true,
        userId: true,
        user: { select: { nickname: true } },
        _count: { select: { clicks: true } },
      },
    }),
    db.subscription.groupBy({ by: ["authorId"], _count: { _all: true } }),
    db.authorHeart.groupBy({ by: ["authorId"], _count: { _all: true } }),
    db.subscription.groupBy({ by: ["subscriberId"], _count: { _all: true } }),
    db.authorHeart.groupBy({ by: ["userId"], _count: { _all: true } }),
    db.workHeart.groupBy({ by: ["userId"], _count: { _all: true } }),
    db.comment.groupBy({
      by: ["userId"],
      where: { userId: { not: null } },
      _count: { _all: true },
    }),
    db.work.findMany({
      orderBy: { viewLogs: { _count: "desc" } },
      take: 10,
      select: {
        id: true,
        title: true,
        publicSlug: true,
        author: { select: { nickname: true } },
        _count: { select: { viewLogs: true, comments: true, hearts: true } },
      },
    }),
  ]);

  const nickOf = new Map(users.map((u) => [u.id, u.nickname]));

  // 플랫폼별 클릭 / 상위 링크 / 작가별 SNS 클릭
  const platformCounts = new Map<string, number>();
  const snsByAuthor = new Map<string, number>();
  for (const l of links) {
    platformCounts.set(
      l.platform.toLowerCase(),
      (platformCounts.get(l.platform.toLowerCase()) ?? 0) + l._count.clicks,
    );
    snsByAuthor.set(l.userId, (snsByAuthor.get(l.userId) ?? 0) + l._count.clicks);
  }
  const platforms = Array.from(platformCounts.entries())
    .map(([platform, clicks]) => ({ platform, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
  const topLinks = links
    .map((l) => ({
      linkId: l.id,
      platform: l.platform,
      url: l.url,
      authorNickname: l.user.nickname,
      clicks: l._count.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // 작가별 합산 (작품 카운트/조회/댓글/작품하트)
  const byAuthor = new Map<
    string,
    { workCount: number; viewCount: number; commentCount: number; heartCount: number }
  >();
  for (const w of works) {
    const a = byAuthor.get(w.authorId) ?? {
      workCount: 0,
      viewCount: 0,
      commentCount: 0,
      heartCount: 0,
    };
    a.workCount += 1;
    a.viewCount += w._count.viewLogs;
    a.commentCount += w._count.comments;
    a.heartCount += w._count.hearts; // 작품 하트
    byAuthor.set(w.authorId, a);
  }
  const subCountOf = new Map(subsByAuthor.map((s) => [s.authorId, s._count._all]));
  const authorHeartOf = new Map(
    authorHeartByAuthor.map((h) => [h.authorId, h._count._all]),
  );
  const creators = Array.from(byAuthor.entries())
    .map(([authorId, a]) => ({
      authorId,
      nickname: nickOf.get(authorId) ?? "(알 수 없음)",
      workCount: a.workCount,
      viewCount: a.viewCount,
      subscriberCount: subCountOf.get(authorId) ?? 0,
      heartCount: a.heartCount + (authorHeartOf.get(authorId) ?? 0), // 작품+작가 하트
      commentCount: a.commentCount,
      snsClicks: snsByAuthor.get(authorId) ?? 0,
    }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 10);

  const topWorks = topWorksRaw.map((w) => ({
    workId: w.id,
    title: w.title,
    publicSlug: w.publicSlug,
    authorNickname: w.author.nickname,
    viewCount: w._count.viewLogs,
    heartCount: w._count.hearts,
    commentCount: w._count.comments,
  }));

  // 활발한 독자 (구독 + 준 하트 + 댓글)
  const readerAgg = new Map<
    string,
    { subscriptions: number; hearts: number; comments: number }
  >();
  const ensure = (id: string) => {
    let r = readerAgg.get(id);
    if (!r) {
      r = { subscriptions: 0, hearts: 0, comments: 0 };
      readerAgg.set(id, r);
    }
    return r;
  };
  for (const s of subsByReader) ensure(s.subscriberId).subscriptions += s._count._all;
  for (const h of authorHeartByUser) ensure(h.userId).hearts += h._count._all;
  for (const h of workHeartByUser) ensure(h.userId).hearts += h._count._all;
  for (const c of commentByUser) if (c.userId) ensure(c.userId).comments += c._count._all;
  const topReaders = Array.from(readerAgg.entries())
    .map(([userId, r]) => ({
      userId,
      nickname: nickOf.get(userId) ?? "(알 수 없음)",
      subscriptions: r.subscriptions,
      hearts: r.hearts,
      comments: r.comments,
      activity: r.subscriptions + r.hearts + r.comments,
    }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 10);

  return {
    totalUsers,
    totalWorks,
    totalViews,
    totalComments,
    totalSubscriptions,
    totalHearts: authorHearts + workHearts,
    totalLinkClicks,
    newUsers7d,
    platforms,
    topLinks,
    creators,
    topWorks,
    topReaders,
  };
}
