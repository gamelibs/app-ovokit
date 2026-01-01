import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import type { PlayMeta } from "@/lib/content/plays";

type CreatePayload = {
  overwrite?: boolean;
  cover?: {
    dataUrl: string;
    alt?: string;
  };
  meta: PlayMeta;
  articleMdx?: string;
};

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

function isSafeSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseImageDataUrl(dataUrl: string) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const base64 = m[2];
  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/jpeg"
        ? "jpg"
        : mime === "image/webp"
          ? "webp"
          : null;
  if (!ext) return null;
  const buf = Buffer.from(base64, "base64");
  return { mime, ext, buf };
}

function playCoverDir(slug: string) {
  return path.join(process.cwd(), "public", "plays", slug);
}

function extFromFile(file: File) {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  if (name.endsWith(".webp")) return "webp";
  if (name.endsWith(".mp4")) return "mp4";
  if (name.endsWith(".webm")) return "webm";

  return null;
}

async function fileToBuffer(file: File) {
  const ab = await file.arrayBuffer();
  return Buffer.from(ab);
}

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) return new NextResponse("Unauthorized", { status: 401 });

  const contentType = req.headers.get("content-type") || "";

  let body: CreatePayload | null = null;
  let coverFile: File | null = null;
  let demoVideoFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    if (!fd) return new NextResponse("Invalid form data", { status: 400 });

    const payloadRaw = fd.get("payload");
    if (typeof payloadRaw !== "string") {
      return new NextResponse("Missing payload", { status: 400 });
    }
    body = (JSON.parse(payloadRaw) as CreatePayload) ?? null;

    const cf = fd.get("cover");
    coverFile = cf instanceof File ? cf : null;

    const vf = fd.get("demoVideo");
    demoVideoFile = vf instanceof File ? vf : null;
  } else {
    body = (await req.json().catch(() => null)) as CreatePayload | null;
  }

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

  let cover: PlayMeta["cover"] | undefined;
  if (coverFile) {
    const ext = extFromFile(coverFile);
    if (!ext || (coverFile.type && !coverFile.type.toLowerCase().startsWith("image/"))) {
      return new NextResponse("Invalid cover image: only png/jpg/webp supported", {
        status: 400,
      });
    }
    const buf = await fileToBuffer(coverFile);
    if (buf.length > 5 * 1024 * 1024) {
      return new NextResponse("Cover image too large (max 5MB)", { status: 400 });
    }

    const outDir = playCoverDir(meta.slug);
    await fs.mkdir(outDir, { recursive: true });
    const filename = `cover.${ext}`;
    const outPath = path.join(outDir, filename);
    await fs.writeFile(outPath, buf);
    cover = {
      src: `/plays/${meta.slug}/${filename}`,
      alt: body.cover?.alt,
    };
  } else if (body.cover?.dataUrl) {
    const parsed = parseImageDataUrl(body.cover.dataUrl);
    if (!parsed) {
      return new NextResponse("Invalid cover image: only png/jpg/webp supported", {
        status: 400,
      });
    }
    if (parsed.buf.length > 2 * 1024 * 1024) {
      return new NextResponse("Cover image too large (max 2MB)", { status: 400 });
    }

    const outDir = playCoverDir(meta.slug);
    await fs.mkdir(outDir, { recursive: true });
    const filename = `cover.${parsed.ext}`;
    const outPath = path.join(outDir, filename);
    await fs.writeFile(outPath, parsed.buf);
    cover = {
      src: `/plays/${meta.slug}/${filename}`,
      alt: body.cover.alt,
    };
  }

  let demoVideoSrc: string | undefined;
  if (demoVideoFile) {
    const ext = extFromFile(demoVideoFile);
    if (!ext || (demoVideoFile.type && !demoVideoFile.type.toLowerCase().startsWith("video/"))) {
      return new NextResponse("Invalid demo video: only mp4/webm supported", {
        status: 400,
      });
    }
    const buf = await fileToBuffer(demoVideoFile);
    if (buf.length > 50 * 1024 * 1024) {
      return new NextResponse("Demo video too large (max 50MB)", { status: 400 });
    }

    const outDir = playCoverDir(meta.slug);
    await fs.mkdir(outDir, { recursive: true });
    const filename = `demo.${ext}`;
    const outPath = path.join(outDir, filename);
    await fs.writeFile(outPath, buf);
    demoVideoSrc = `/plays/${meta.slug}/${filename}`;
  }

  const normalized: PlayMeta = {
    ...meta,
    cover: cover ?? meta.cover,
    stats: meta.stats ?? { views: 0, likes: 0 },
    breakdown: meta.breakdown ?? [],
    codeSnippets: meta.codeSnippets ?? [],
    demo: {
      ...(meta.demo ?? {}),
      ...(demoVideoSrc ? { videoSrc: demoVideoSrc, iframeSrc: undefined } : {}),
    },
  };

  await fs.writeFile(metaPath, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  if (typeof body.articleMdx === "string") {
    await fs.writeFile(articlePath, body.articleMdx, "utf8");
  }

  return NextResponse.json({ ok: true, slug: meta.slug });
}

