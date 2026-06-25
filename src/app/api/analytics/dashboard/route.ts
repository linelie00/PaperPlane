import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { getDashboardStats } from "@/lib/analytics";

// GET /api/analytics/dashboard — 대시보드 통계 (로그인 필요, docs/04_API_SPEC.md)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ApiError.unauthorized();

  const stats = await getDashboardStats(user.userId);
  return NextResponse.json(stats);
}
