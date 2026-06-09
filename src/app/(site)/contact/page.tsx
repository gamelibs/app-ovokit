import Link from "next/link";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function ContactPage() {
  return (
    <StaticPageShell
      title="联系"
      subtitle="反馈问题、建议选题、提交案例合作。"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        联系邮箱
      </h2>
      {siteConfig.contactEmail ? (
        <p>
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        </p>
      ) : (
        <>
          <p>
            站点尚未设置公开邮箱。部署时可通过环境变量{" "}
            <code>NEXT_PUBLIC_CONTACT_EMAIL</code> 配置展示在此处。
          </p>
          <p className="text-xs text-zinc-500">
            建议在提交 Google / AdSense 审核前配置真实可用的联系方式。
          </p>
        </>
      )}

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        反馈建议
      </h2>
      <ul className="list-disc pl-5">
        <li>指出页面链接与问题描述（最好附上截图）。</li>
        <li>如果是 Demo 相关问题，请描述复现步骤与设备/浏览器版本。</li>
        <li>如果是内容建议，请说明你希望补齐的“玩法母型 / 具体帖子 / 技术点”。</li>
      </ul>

      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        隐私
      </h2>
      <p>
        联系时你提供的信息仅用于处理你的反馈与后续沟通。更多说明见{" "}
        <Link href="/privacy">隐私政策</Link>。
      </p>
    </StaticPageShell>
  );
}
