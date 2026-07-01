import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { sanitizeText, isSafeHttpUrl } from "@/lib/utils";

const MAX_LINKS = 8;

// PUT /api/profile/links — 작가 SNS 링크 전체 교체 (로그인 필수)
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  let body: { links?: { platform?: string; url?: string }[] };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  const raw = Array.isArray(body.links) ? body.links : [];
  if (raw.length > MAX_LINKS) {
    return errorResponse("TOO_MANY_LINKS", `링크는 최대 ${MAX_LINKS}개까지 등록할 수 있습니다.`, 400);
  }

  const cleaned: { platform: string; url: string; order: number }[] = [];
  for (const [i, l] of raw.entries()) {
    const platform = sanitizeText(l.platform ?? "").slice(0, 30);
    const url = (l.url ?? "").trim();
    if (!platform && !url) continue; // 빈 행은 무시
    if (!url || !isSafeHttpUrl(url)) {
      return errorResponse("INVALID_URL", "링크는 http(s) 주소여야 합니다.", 400);
    }
    cleaned.push({ platform: platform || "link", url, order: i });
  }

  // 전체 교체 (트랜잭션)
  await db.$transaction([
    db.authorLink.deleteMany({ where: { userId: user.userId } }),
    ...(cleaned.length > 0
      ? [
          db.authorLink.createMany({
            data: cleaned.map((c) => ({ ...c, userId: user.userId })),
          }),
        ]
      : []),
  ]);

  const links = await db.authorLink.findMany({
    where: { userId: user.userId },
    orderBy: { order: "asc" },
    select: { id: true, platform: true, url: true },
  });

  return NextResponse.json({ success: true, links });
}
