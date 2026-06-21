import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, signModeratorCookie } from "@/lib/mod/auth";
import { rateLimitByIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { allowed, resetAt } = rateLimitByIp(req, RATE_LIMITS.login);
  if (!allowed) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    });
  }

  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  const expected = process.env.MOD_PASSWORD;
  if (!expected) {
    return new NextResponse(
      "MOD_PASSWORD not configured. Set MOD_PASSWORD in .env.local (or export it) and restart `pnpm dev`.",
      { status: 500 },
    );
  }
  if (!password || password !== expected) {
    return new NextResponse("Invalid password", { status: 401 });
  }

  const c = await cookies();
  c.set({
    name: MOD_COOKIE,
    value: signModeratorCookie(expected),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
