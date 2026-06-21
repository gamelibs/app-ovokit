import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE } from "@/lib/mod/auth";

export async function POST() {
  const c = await cookies();
  c.set({
    name: MOD_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
