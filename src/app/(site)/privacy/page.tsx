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
        本政策适用于 {siteConfig.name}（下称“本站”，域名 ovoforge.com）。本站以内容浏览与试玩为主，不提供公开账号体系。
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        我们收集哪些信息
      </h2>
      <h3 className="text-sm font-semibold text-ink font-kalam">
        访问日志（服务器侧）
      </h3>
      <p>
        当你访问本站时，服务器可能会记录基础访问日志（例如请求时间、请求路径、浏览器信息、来源页面等），用于安全与故障排查。
      </p>

      <h3 className="text-sm font-semibold text-ink font-kalam">
        Cookie
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>必要 Cookie</strong>：用于内容管理后台的登录状态鉴权，不用于追踪普通访客。关闭浏览器或退出登录后失效。
        </li>
        <li>
          <strong>分析 Cookie</strong>：我们使用 Google Analytics 了解访问情况（例如页面浏览量、访问来源、设备类型）。Google Analytics 仅在通过底部 Cookie 横幅明确同意后才会加载，相关数据由 Google 按其隐私政策处理。
        </li>
        <li>
          <strong>Cookie 同意偏好</strong>：你的同意选择（必要/分析）存储在浏览器本地，横幅关闭后不再重复提示。
        </li>
      </ul>

      <h3 className="text-sm font-semibold text-ink font-kalam">
        本地存储（localStorage）
      </h3>
      <ul className="list-disc pl-5">
        <li>
          <strong>收藏夹</strong>：你点击“收藏”按钮的内容列表保存在浏览器本地，不会上传到服务器。
        </li>
        <li>
          <strong>界面状态</strong>：用于记住某些界面元素的显示状态，仅在当前设备有效。
        </li>
        <li>
          <strong>编辑草稿</strong>：内容编辑页面可能会把草稿临时缓存在本地，以防误刷新丢失。
        </li>
        <li>
          <strong>Cookie 同意偏好</strong>：记录你对 Cookie 横幅的选择，key 为 <code className="font-mono">ovoforge-cookie-consent</code>。
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        我们如何使用这些信息
      </h2>
      <ul className="list-disc pl-5">
        <li>保障站点安全与稳定性（防滥用、排查故障）。</li>
        <li>提供内容管理所需的最小鉴权与编辑体验。</li>
        <li>在获得同意的前提下，通过 Google Analytics 改进内容与导航体验。</li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        第三方服务
      </h2>
      <p>
        本站使用以下第三方服务处理数据：
      </p>
      <ul className="list-disc pl-5">
        <li>
          <strong>Google Analytics</strong>：用于访问统计分析，仅在用户同意分析 Cookie 后加载。详见{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted hover:text-ink"
          >
            Google 隐私政策
          </a>
          。
        </li>
        <li>
          <strong>嵌入 Demo</strong>：部分页面通过 iframe 嵌入演示内容。嵌入内容的行为与数据处理以对应页面/服务为准。
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        你的控制权
      </h2>
      <ul className="list-disc pl-5">
        <li>你可以通过浏览器设置清除 Cookie 和 localStorage。</li>
        <li>如果你希望撤销对分析 Cookie 的同意，可清除浏览器本地存储后刷新页面，横幅会重新出现。</li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        联系我们
      </h2>
      <p>
        若你对隐私政策有疑问，可前往 <Link href="/contact" className="underline decoration-dotted hover:text-ink">联系页面</Link>。
      </p>
    </StaticPageShell>
  );
}
