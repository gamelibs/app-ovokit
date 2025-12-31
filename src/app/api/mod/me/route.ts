import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";

export async function GET() {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  return NextResponse.json({ isModerator });
}

