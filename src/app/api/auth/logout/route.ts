import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// POST /api/auth/logout — 로그아웃 (docs/04_API_SPEC.md)
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true }, { status: 200 });
}
