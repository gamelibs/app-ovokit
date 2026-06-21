import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function AboutPage() {
  return (
    <StaticPageShell
      title="关于 OVO"
      subtitle="一个面向所有游戏爱好者的玩法分享站点：一起拆解、学习与发现让游戏好玩的秘密。"
    >
      <p>
        {siteConfig.name} 希望把“玩法”变成大家都能聊、都能学的内容：一款游戏为什么让人上瘾？它的核心规则循环是什么？如果换几个参数，体验会有什么不同？
        这里既有轻松可读的拆解，也有最小可玩 Demo 和实现思路，帮助你从“玩家”走向“设计者”。
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        站点内容
      </h2>
      <ul className="list-disc pl-5">
        <li>
          <strong>玩法帖子（Play）</strong>：每篇围绕一个具体玩法，拆解规则循环、关键设计点，并提供可试玩 Demo 与实现思路。
        </li>
        <li>
          <strong>母型玩法（Archetype）</strong>：固定 12 个母型，用于建立学习路径与“该从哪里入门”的锚点。
        </li>
        <li>
          <strong>嵌入式演示（Embed）</strong>：把试玩隔离在独立页面中，避免滚动与交互互相干扰，便于分享。
        </li>
      </ul>

      <h2 className="text-base font-semibold text-ink font-kalam">
        P0 上线说明
      </h2>
      <p>
        当前阶段以“只读公开站”为主：面向访问者提供浏览、阅读与试玩；站内发布与编辑功能不对公众开放。
      </p>

      <h2 className="text-base font-semibold text-ink font-kalam">
        联系
      </h2>
      <p>
        如需反馈问题或合作，请前往 <a href="/contact">联系页面</a>。
      </p>
    </StaticPageShell>
  );
}
