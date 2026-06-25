import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { getClientIp, hashIp } from "@/lib/utils";

// POST /api/analytics/view — 조회수 기록 (로그인 불필요, docs/04_API_SPEC.md)
// 공개 뷰어 접근 시 호출되며, 조회수 1 증가 + 유입 정보(ViewLog) 저장.
export async function POST(req: NextRequest) {
  let body: {
    publicSlug?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_PAYLOAD", "잘못된 요청입니다.", 400);
  }

  if (!body.publicSlug) {
    return errorResponse("MISSING_SLUG", "publicSlug가 필요합니다.", 400);
  }

  const work = await db.work.findUnique({
    where: { publicSlug: body.publicSlug },
  });
  if (!work) {
    return errorResponse("SLUG_NOT_FOUND", "작품을 찾을 수 없습니다.", 404);
  }
  if (!work.isPublic) {
    return errorResponse("WORK_NOT_PUBLIC", "비공개 작품입니다.", 403);
  }

  await db.viewLog.create({
    data: {
      workId: work.id,
      referrer: body.referrer ?? null,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      userAgent: req.headers.get("user-agent"),
      // IP는 원문 저장하지 않고 해시 처리한다. (docs/05_DB_SCHEMA.md)
      ipHash: hashIp(getClientIp(req.headers)),
    },
  });

  const viewCount = await db.viewLog.count({ where: { workId: work.id } });

  return NextResponse.json({ success: true, viewCount });
}
