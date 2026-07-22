/**
 * 批量重绘全站帖子封面（蚀刻报纸风 webp）。
 * - 每帖生成 cover.webp（480×360 卡片）+ cover-wide.webp（600×450 详情头图）
 * - 更新 meta.json 的 cover / coverWide 指向新 webp（旧 svg/截图引用全部替换）
 * - 删除旧 cover.svg / cover.png / cover.jpg / coverWide.*
 * 用法：npx tsx scripts/regen-covers.ts [--slug <slug>]
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderCoverWebp, inferArchetypeFromTags } from "../src/lib/cover-gen/render";

async function main() {
  const root = path.join(process.cwd(), "content", "plays");
  const publicRoot = path.join(process.cwd(), "public", "plays");

  const onlySlug = process.argv.includes("--slug")
    ? process.argv[process.argv.indexOf("--slug") + 1]
    : null;

  const slugs = (await fs.readdir(root)).filter(
    (s) => !s.startsWith("_") && (!onlySlug || s === onlySlug),
  );

  let ok = 0;
  for (const slug of slugs) {
    const metaPath = path.join(root, slug, "meta.json");
    let meta: any;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    } catch {
      console.log(`SKIP ${slug}: meta.json 不可读`);
      continue;
    }

    const archetype = inferArchetypeFromTags(meta.tags ?? [], slug);
    const title = meta.title ?? "";
    const outDir = path.join(publicRoot, slug);
    await fs.mkdir(outDir, { recursive: true });

    const cardBuf = await renderCoverWebp(slug, archetype, "card", 0);
    await fs.writeFile(path.join(outDir, "cover.webp"), cardBuf);

    // 删除旧封面文件（svg/png/jpg/jpeg + 旧 coverWide 系列）
    for (const f of await fs.readdir(outDir)) {
      if (/^cover(-wide)?\.(svg|png|jpe?g)$/i.test(f) || /^cover-wide\.webp$/i.test(f)) {
        await fs.rm(path.join(outDir, f), { force: true });
      }
    }

    // 统一单封面：cover 与 coverWide 同源
    meta.cover = { src: `/plays/${slug}/cover.webp`, alt: title };
    meta.coverWide = { src: `/plays/${slug}/cover.webp`, alt: title };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
    ok++;
    console.log(`OK ${slug} → ${archetype} (${(cardBuf.length / 1024).toFixed(1)}KB)`);
  }
  console.log(`\n完成：${ok}/${slugs.length} 篇帖子封面已重绘`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
