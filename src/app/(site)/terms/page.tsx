import Link from "next/link";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function TermsPage() {
  return (
    <StaticPageShell
      title="使用条款"
      subtitle="使用本站前请阅读以下条款。"
    >
      <p>
        欢迎访问 {siteConfig.name}（下称“本站”）。使用本站即表示你同意遵守本条款。
      </p>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        内容与免责声明
      </h2>
      <ul className="list-disc pl-5">
        <li>本站内容用于学习与交流，不构成任何形式的保证或承诺。</li>
        <li>本站可能包含实验性 Demo/示例代码，请在生产环境使用前自行评估与测试。</li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        知识产权
      </h2>
      <ul className="list-disc pl-5">
        <li>站内文章、图文与演示的权利归原作者或权利人所有（如有标注则以标注为准）。</li>
        <li>如你认为本站内容侵犯了你的权益，请通过 <Link href="/contact">联系页面</Link> 反馈，我们会尽快处理。</li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        禁止行为
      </h2>
      <ul className="list-disc pl-5">
        <li>恶意请求、刷量、攻击、探测漏洞等影响站点稳定与安全的行为。</li>
        <li>未经授权尝试访问或修改版主内容管理功能。</li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        条款更新
      </h2>
      <p>
        我们可能会不定期更新本条款。更新后继续使用本站即视为你接受更新内容。
      </p>
    </StaticPageShell>
  );
}
