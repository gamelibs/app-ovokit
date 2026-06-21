"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticPageShell } from "@/components/site/StaticPageShell";
import { siteConfig } from "@/lib/site/config";

const MAX_SUBJECT = 100;
const MAX_MESSAGE = 200;
const MIN_MESSAGE = 10;

function containsForbiddenChars(text: string) {
  // 禁止可能用于 HTML / 脚本注入的字符
  return /[<>]/.test(text);
}

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      setError("主题和内容为必填项");
      setBusy(false);
      return;
    }
    if (trimmedSubject.length > MAX_SUBJECT) {
      setError(`主题不能超过 ${MAX_SUBJECT} 字`);
      setBusy(false);
      return;
    }
    if (trimmedMessage.length < MIN_MESSAGE) {
      setError(`内容至少需要 ${MIN_MESSAGE} 字`);
      setBusy(false);
      return;
    }
    if (trimmedMessage.length > MAX_MESSAGE) {
      setError(`内容不能超过 ${MAX_MESSAGE} 字`);
      setBusy(false);
      return;
    }
    if (containsForbiddenChars(trimmedSubject) || containsForbiddenChars(trimmedMessage)) {
      setError("主题或内容包含非法字符（如 < >），请修改后重试");
      setBusy(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: trimmedSubject, message: trimmedMessage }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = (await res.json().catch(() => ({
        error: res.status >= 500 ? "服务器暂时不可用" : "提交失败",
      }))) as { ok?: boolean; error?: string; sent?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "提交失败");
      }
      setOk(true);
      setMailSent(data.sent === true);
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
      <h2 className="text-base font-semibold text-ink font-kalam">
        发送留言
      </h2>
      <p className="mt-1 text-sm text-ink-light">
        你的留言将发送到 {siteConfig.contactEmail}。
      </p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">主题</span>
          <input
            required
            maxLength={MAX_SUBJECT}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder="例如：建议新增塔防玩法"
          />
          <span className="text-right text-xs text-ink-muted">
            {subject.length} / {MAX_SUBJECT}
          </span>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">内容</span>
          <textarea
            required
            minLength={MIN_MESSAGE}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder="请简明描述你的反馈或建议（10-200 字）..."
          />
          <span className="text-right text-xs text-ink-muted">
            {message.length} / {MAX_MESSAGE}
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
          <div
            className={`rounded-xl border-2 bg-paper p-3 text-sm text-ink ${
              mailSent
                ? "border-highlight-green"
                : "border-highlight-yellow"
            }`}
          >
            {mailSent
              ? "✅ 留言已发送，我们会尽快查看并回复。"
              : "⚠️ 留言已保存，但邮件服务尚未配置，邮件未实际发送。请联系管理员配置 SMTP。"}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border-2 border-highlight-red bg-paper p-3 text-sm text-ink">
            ❌ {error}
          </div>
        ) : null}
      </form>

      <h2 className="mt-8 text-base font-semibold text-ink font-kalam">
        反馈建议
      </h2>
      <ul className="list-disc pl-5">
        <li>指出页面链接与问题描述（最好附上截图）。</li>
        <li>如果是 Demo 相关问题，请描述复现步骤与设备/浏览器版本。</li>
        <li>如果是内容建议，请说明你希望补齐的「玩法母型 / 具体帖子 / 技术点」。</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-ink font-kalam">
        隐私
      </h2>
      <p>
        你提交的主题与内容仅用于处理反馈与后续沟通。更多说明见{" "}
        <Link href="/privacy">隐私政策</Link>。
      </p>
    </StaticPageShell>
  );
}
