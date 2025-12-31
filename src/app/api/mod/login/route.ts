import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE } from "@/lib/mod/auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  const expected = process.env.MOD_PASSWORD;
  if (!expected) {
    return new NextResponse("MOD_PASSWORD not configured", { status: 500 });
  }
  if (!password || password !== expected) {
    return new NextResponse("Invalid password", { status: 401 });
  }

  const c = await cookies();
  c.set({
    name: MOD_COOKIE,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}

