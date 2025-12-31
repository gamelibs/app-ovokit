import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import type { PlayMeta } from "@/lib/content/plays";

type CreatePayload = {
  overwrite?: boolean;
  meta: PlayMeta;
  articleMdx?: string;
};

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

function isSafeSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as CreatePayload | null;
  if (!body?.meta) return new NextResponse("Missing meta", { status: 400 });

  const meta = body.meta;
  if (!meta.slug || !isSafeSlug(meta.slug)) {
    return new NextResponse(
      "Invalid slug: use lowercase letters, numbers, and hyphens",
      { status: 400 },
    );
  }
  if (!meta.title || !meta.subtitle) {
    return new NextResponse("Missing title/subtitle", { status: 400 });
  }

  const root = playsRootDir();
  const dir = path.join(root, meta.slug);

  await fs.mkdir(root, { recursive: true });

  const exists = await fs
    .stat(dir)
    .then(() => true)
    .catch(() => false);
  if (exists && !body.overwrite) {
    return new NextResponse("Slug already exists", { status: 409 });
  }

  await fs.mkdir(dir, { recursive: true });

  const metaPath = path.join(dir, "meta.json");
  const articlePath = path.join(dir, "article.mdx");

  const normalized: PlayMeta = {
    ...meta,
    stats: meta.stats ?? { views: 0, likes: 0 },
    breakdown: meta.breakdown ?? [],
    codeSnippets: meta.codeSnippets ?? [],
    demo: meta.demo ?? {},
  };

  await fs.writeFile(metaPath, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  if (typeof body.articleMdx === "string") {
    await fs.writeFile(articlePath, body.articleMdx, "utf8");
  }

  return NextResponse.json({ ok: true, slug: meta.slug });
}

