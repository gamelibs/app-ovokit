import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { renderCoverWebp, inferArchetypeFromTags } from "@/lib/cover-gen/render";
import { ARCHETYPE_NAME } from "@/lib/cover-gen/compose";

/**
 * 用户可操作的封面重生成（编辑页「生成封面」面板调用）。
 * POST { slug, archetype?, variant? }
 * - slug 必填：写入 public/plays/<slug>/cover.webp 与 cover-wide.webp，并更新 meta.json
 * - archetype 缺省：按帖子标签自动推断
 * - variant：变体序号（0,1,2…），换一张时递增
 */
export async function POST(req: Request) {
  const c = await cookies();
  if (!isModeratorCookieValue(c.get(MOD_COOKIE)?.value)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    archetype?: string;
    variant?: number;
  };
  const slug = body.slug?.trim();
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return new NextResponse("无效的 slug", { status: 400 });
  }

  const metaPath = path.join(process.cwd(), "content", "plays", slug, "meta.json");
  let meta: Record<string, any>;
  try {
    meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
  } catch {
    return new NextResponse("帖子不存在", { status: 404 });
  }

  const archetype =
    body.archetype && ARCHETYPE_NAME[body.archetype]
      ? body.archetype
      : inferArchetypeFromTags(meta.tags ?? [], slug);
  const variant = Number.isInteger(body.variant) && (body.variant as number) >= 0 ? (body.variant as number) : 0;

  try {
    const outDir = path.join(process.cwd(), "public", "plays", slug);
    await fs.mkdir(outDir, { recursive: true });
    const cardBuf = await renderCoverWebp(slug, archetype, "card", variant);
    await fs.writeFile(path.join(outDir, "cover.webp"), cardBuf);

    // 统一单封面：cover 与 coverWide 同源（不再区分横竖版）
    meta.cover = { src: `/plays/${slug}/cover.webp`, alt: meta.title ?? slug };
    meta.coverWide = { src: `/plays/${slug}/cover.webp`, alt: meta.title ?? slug };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");

    const bust = `?v=${Date.now()}`;
    return NextResponse.json({
      ok: true,
      archetype,
      variant,
      cover: `${meta.cover.src}${bust}`,
      coverWide: `${meta.coverWide.src}${bust}`,
    });
  } catch (e) {
    return new NextResponse(`封面生成失败：${e instanceof Error ? e.message : "未知错误"}`, {
      status: 500,
    });
  }
}
