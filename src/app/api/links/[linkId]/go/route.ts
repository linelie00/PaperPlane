import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, hashIp } from "@/lib/utils";

// GET /api/links/[linkId]/go — SNS 링크 클릭을 기록하고 실제 URL로 리다이렉트한다.
// 앵커 href로 그대로 사용되며, 클릭률 지표(LinkClick)를 남긴다.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  const link = await db.authorLink.findUnique({
    where: { id: linkId },
    select: { url: true },
  });
  if (!link) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const user = await getCurrentUser();
  await db.linkClick.create({
    data: {
      linkId,
      userId: user?.userId ?? null,
      referrer: req.headers.get("referer"),
      ipHash: hashIp(getClientIp(req.headers)),
    },
  });

  return NextResponse.redirect(link.url);
}
