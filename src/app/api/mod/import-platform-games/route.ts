import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";

const GATEWAY = process.env.OVO_GATEWAY_BASE || "http://127.0.0.1:19527";
const PLATFORM_ID = process.env.OVO_PLATFORM_ID || "1021";

/** 扫描已有帖子，建立 gameId → slug 的血缘索引（一游戏一帖子） */
async function buildImportedIndex(): Promise<Record<string, string>> {
  const index: Record<string, string> = {};
  try {
    const root = path.join(process.cwd(), "content", "plays");
    for (const slug of await fs.readdir(root)) {
      try {
        const meta = JSON.parse(
          await fs.readFile(path.join(root, slug, "meta.json"), "utf8"),
        ) as { source?: { platformId?: string; gameId?: string } };
        if (meta.source?.platformId === PLATFORM_ID && meta.source.gameId) {
          index[meta.source.gameId] = slug;
        }
      } catch {
        // 单个帖子读取失败跳过
      }
    }
  } catch {
    // content 目录不存在
  }
  return index;
}

export async function GET(req: Request) {
  const c = await cookies();
  if (!isModeratorCookieValue(c.get(MOD_COOKIE)?.value)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const env = searchParams.get("env") || "beta";
  try {
    const [res, importedBy] = await Promise.all([
      fetch(`${GATEWAY}/api/platform/${PLATFORM_ID}/export/games?env=${env}`, { cache: "no-store" }),
      buildImportedIndex(),
    ]);
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.message || "gateway error");
    const games = (data.data.games ?? []).map((g: Record<string, unknown>) => ({
      ...g,
      importedSlug: importedBy[String(g.gameId)] ?? null,
    }));
    return NextResponse.json({ ...data.data, games });
  } catch (e) {
    return new NextResponse(`拉取平台游戏列表失败：${e instanceof Error ? e.message : "未知错误"}`, {
      status: 502,
    });
  }
}
