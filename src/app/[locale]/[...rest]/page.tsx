import { notFound } from "next/navigation";

// 未匹配 URL 统一走 [locale]/not-found.tsx（保留站点壳与手绘 404 页）；
// 多 root layout 结构下顶层 app/not-found.tsx 无法生效，这是 next-intl 推荐的 catch-all 方案。
export default function CatchAllPage() {
  notFound();
}
