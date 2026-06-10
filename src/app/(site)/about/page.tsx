import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function AboutPage() {
  return (
    <StaticPageShell
      title="关于 OVOKIT"
      subtitle="面向游戏开发者的玩法技术分享站：结构化拆解 + 可试玩演示。"
    >
      <p>
        {siteConfig.name} 的目标是把“玩法”沉淀成可复用的结构化信息：交互与规则、判定与数据结构、关键代码与算法、以及可嵌入的试玩演示。
        你可以把它当作一个偏技术向的玩法目录与知识库。
      </p>

      <h2 className="text-base font-semibold text-ink">
        站点内容
      </h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>玩法帖子（Play）</strong>：每篇包含拆解、关键代码、演示与文章，便于快速复现与二次开发。
        </li>
        <li>
          <strong>母型玩法（Archetype）</strong>：固定 12 个母型，用于建立学习路径与“该从哪里入门”的锚点。
        </li>
        <li>
          <strong>嵌入式演示（Embed）</strong>：把试玩隔离在独立页面中，避免滚动与交互互相干扰，便于分享。
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink">
        P0 上线说明
      </h2>
      <p>
        当前阶段以“只读公开站”为主：面向访问者提供浏览、阅读与试玩；站内发布与编辑仅对版主开放。
      </p>

      <h2 className="text-base font-semibold text-ink">
        联系
      </h2>
      <p>
        如需反馈问题或合作，请前往 <a href="/contact">联系页面</a>。
      </p>
    </StaticPageShell>
  );
}
