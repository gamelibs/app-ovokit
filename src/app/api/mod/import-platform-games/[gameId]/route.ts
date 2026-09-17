import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { buildPlayDraftFromSiteData, type SiteData } from "@/lib/mod/platform-import";
import { renderCoverWebp } from "@/lib/cover-gen/render";

const GATEWAY = process.env.OVO_GATEWAY_BASE || "http://127.0.0.1:19527";
const PLATFORM_ID = process.env.OVO_PLATFORM_ID || "1021";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ gameId: string }> },
) {
  const c = await cookies();
  if (!isModeratorCookieValue(c.get(MOD_COOKIE)?.value)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { gameId } = await ctx.params;
  try {
    const res = await fetch(`${GATEWAY}/api/platform/${PLATFORM_ID}/export/games/${gameId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.message || "gateway error");
    const { previewUrl, siteData } = data.data as {
      previewUrl: string;
      coverUrl: string | null;
      animatedCoverUrl: string | null;
      siteData: SiteData | null;
    };
    if (!siteData) {
      return new NextResponse("该游戏没有 siteData（请先在 studio 导出并勾选玩法数据）", { status: 422 });
    }
    const draft = buildPlayDraftFromSiteData(siteData, previewUrl);

    // 封面：按母型生成蚀刻报纸风 webp（统一全站风格，不使用游戏截图；单封面不区分横竖）
    let cover: { src: string; alt: string } | null = null;
    let coverWide: { src: string; alt: string } | null = null;
    try {
      const dir = path.join(process.cwd(), "public", "imported-covers");
      await fs.mkdir(dir, { recursive: true });
      const archetype = siteData.classification.archetype ?? "puzzle";
      const cardBuf = await renderCoverWebp(draft.slug, archetype, "card", 0);
      await fs.writeFile(path.join(dir, `${gameId}.webp`), cardBuf);
      cover = { src: `/imported-covers/${gameId}.webp`, alt: draft.title };
      coverWide = { src: `/imported-covers/${gameId}.webp`, alt: draft.title };
    } catch {
      cover = null;
      coverWide = null;
    }

    return NextResponse.json({ draft, cover, coverWide });
  } catch (e) {
    return new NextResponse(`拉取游戏数据失败：${e instanceof Error ? e.message : "未知错误"}`, {
      status: 502,
    });
  }
}
