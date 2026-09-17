import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { listArchetypeSpecs } from "@/lib/archetypes/spec";

export async function GET() {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const specs = await listArchetypeSpecs();
  return NextResponse.json(specs);
}
