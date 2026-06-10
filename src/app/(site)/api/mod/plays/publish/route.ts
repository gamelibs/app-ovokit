import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import type { PlayMeta } from "@/lib/content/plays";

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) return new NextResponse("Unauthorized", { status: 401 });

  const { slug, published } = (await req.json().catch(() => ({}))) as {
    slug?: string;
    published?: boolean;
  };
  if (!slug || typeof slug !== "string") {
    return new NextResponse("Missing slug", { status: 400 });
  }
  if (typeof published !== "boolean") {
    return new NextResponse("Missing published flag", { status: 400 });
  }

  const metaPath = path.join(playsRootDir(), slug, "meta.json");

  let meta: PlayMeta;
  try {
    const raw = await fs.readFile(metaPath, "utf8");
    meta = JSON.parse(raw) as PlayMeta;
  } catch {
    return new NextResponse("Play not found", { status: 404 });
  }

  meta.published = published;
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");

  return NextResponse.json({ ok: true, slug, published });
}
