"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "提交失败");
      }
      setOk(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaticPageShell
      title="联系"
      subtitle="反馈问题、建议选题、提交案例合作。"
    >
      <h2 className="text-base font-semibold text-ink">
        发送留言
      </h2>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">姓名</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              placeholder="怎么称呼你"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted">邮箱</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              placeholder="your@email.com"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted">主题</span>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder="例如：建议新增塔防玩法"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted">内容</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder="详细描述你的反馈或建议..."
          />
          <span className="text-right text-xs text-ink-muted">
            {message.length} / 5000
          </span>
        </label>

        <button
          type="submit"
          disabled={busy}
          className="sketch-button bg-highlight-blue hover:bg-highlight-blue/90 disabled:opacity-50"
        >
          {busy ? "提交中..." : "发送留言"}
        </button>

        {ok ? (
          <div className="rounded-xl border-2 border-highlight-green bg-paper p-3 text-sm text-ink">
            ✅ 留言已发送，我们会尽快查看并回复。
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border-2 border-highlight-red bg-paper p-3 text-sm text-ink">
            ❌ {error}
          </div>
        ) : null}
      </form>

      <h2 className="mt-8 text-base font-semibold text-ink">
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
          <p className="text-xs text-ink-muted">
            建议在提交 Google / AdSense 审核前配置真实可用的联系方式。
          </p>
        </>
      )}

      <h2 className="mt-6 text-base font-semibold text-ink">
        反馈建议
      </h2>
      <ul className="list-disc pl-5">
        <li>指出页面链接与问题描述（最好附上截图）。</li>
        <li>如果是 Demo 相关问题，请描述复现步骤与设备/浏览器版本。</li>
        <li>如果是内容建议，请说明你希望补齐的"玩法母型 / 具体帖子 / 技术点"。</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-ink">
        隐私
      </h2>
      <p>
        联系时你提供的信息仅用于处理你的反馈与后续沟通。更多说明见{" "}
        <Link href="/privacy">隐私政策</Link>。
      </p>
    </StaticPageShell>
  );
}
