import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { deletePlayStats } from "@/lib/content/views";

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

function playPublicDir(slug: string) {
  return path.join(process.cwd(), "public", "plays", slug);
}

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) return new NextResponse("Unauthorized", { status: 401 });

  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug || typeof slug !== "string") {
    return new NextResponse("Missing slug", { status: 400 });
  }

  const contentDir = path.join(playsRootDir(), slug);
  const publicDir = playPublicDir(slug);

  // Delete content directory
  try {
    await fs.rm(contentDir, { recursive: true, force: true });
  } catch {
    // ignore if not exists
  }

  // Delete public assets directory
  try {
    await fs.rm(publicDir, { recursive: true, force: true });
  } catch {
    // ignore if not exists
  }

  // Delete stats record
  await deletePlayStats(slug);

  return NextResponse.json({ ok: true });
}
