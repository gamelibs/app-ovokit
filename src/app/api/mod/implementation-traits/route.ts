import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { listImplementationTraitSpecs } from "@/lib/implementation-traits/spec";

export async function GET() {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const specs = await listImplementationTraitSpecs();
  return NextResponse.json(specs);
}
