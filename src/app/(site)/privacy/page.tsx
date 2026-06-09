import Link from "next/link";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function PrivacyPage() {
  return (
    <StaticPageShell
      title="隐私政策"
      subtitle="说明站点如何处理与存储访问过程中产生的数据。"
    >
      <p>
        本政策适用于 {siteConfig.name}（下称“本站”）。本站以内容浏览与试玩为主，不提供公开账号体系。
      </p>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        我们收集哪些信息
      </h2>
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        访问日志（服务器侧）
      </h3>
      <p>
        当你访问本站时，服务器可能会记录基础访问日志（例如请求时间、请求路径、浏览器信息、来源页面等），用于安全与故障排查。
      </p>

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Cookie
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>版主登录状态</strong>：仅在版主模式下使用 httpOnly cookie 记录登录状态，用于内容管理接口鉴权。
        </li>
      </ul>

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        本地存储（localStorage）
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>版主工具开关</strong>：用于记住是否显示版主入口（例如连点解锁后的显示状态）。
        </li>
        <li>
          <strong>发布草稿</strong>：版主在新建内容页可能会把草稿临时缓存在本地，以防误刷新丢失。
        </li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        我们如何使用这些信息
      </h2>
      <ul className="list-disc pl-5">
        <li>保障站点安全与稳定性（防滥用、排查故障）。</li>
        <li>提供版主内容管理功能所需的最小鉴权与编辑体验。</li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        第三方内容
      </h2>
      <p>
        本站部分页面可能通过 iframe 嵌入演示内容。嵌入内容的行为与数据处理以对应页面/服务为准。
      </p>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        联系我们
      </h2>
      <p>
        若你对隐私政策有疑问，可前往 <Link href="/contact">联系页面</Link>。
      </p>
    </StaticPageShell>
  );
}
