"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("contactPage");
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
      setError(t("errRequired"));
      setBusy(false);
      return;
    }
    if (trimmedSubject.length > MAX_SUBJECT) {
      setError(t("errSubjectTooLong", { max: MAX_SUBJECT }));
      setBusy(false);
      return;
    }
    if (trimmedMessage.length < MIN_MESSAGE) {
      setError(t("errMessageTooShort", { min: MIN_MESSAGE }));
      setBusy(false);
      return;
    }
    if (trimmedMessage.length > MAX_MESSAGE) {
      setError(t("errMessageTooLong", { max: MAX_MESSAGE }));
      setBusy(false);
      return;
    }
    if (containsForbiddenChars(trimmedSubject) || containsForbiddenChars(trimmedMessage)) {
      setError(t("errForbiddenChars"));
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
      // API 可能返回服务端内部中文错误，这里统一映射为本地化通用文案，不回显原文
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: boolean;
      };
      if (!res.ok || !data.ok) {
        setError(res.status >= 500 ? t("errServerUnavailable") : t("errSubmitFailed"));
        return;
      }
      setOk(true);
      setMailSent(data.sent === true);
      setSubject("");
      setMessage("");
    } catch {
      setError(t("errServerUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaticPageShell
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <h2 className="text-base font-semibold text-ink font-kalam">
        {t("h2Send")}
      </h2>
      <p className="mt-1 text-sm text-ink-light">
        {t("sendNote", { email: siteConfig.contactEmail })}
      </p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">{t("labelSubject")}</span>
          <input
            required
            maxLength={MAX_SUBJECT}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder={t("phSubject")}
          />
          <span className="text-right text-xs text-ink-muted">
            {subject.length} / {MAX_SUBJECT}
          </span>
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-ink-muted font-kalam">{t("labelMessage")}</span>
          <textarea
            required
            minLength={MIN_MESSAGE}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder={t("phMessage")}
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
          {busy ? t("submitBusy") : t("submit")}
        </button>

        {ok ? (
          <div
            className={`rounded-xl border-2 bg-paper p-3 text-sm text-ink ${
              mailSent
                ? "border-highlight-green"
                : "border-highlight-yellow"
            }`}
          >
            {mailSent ? t("okSent") : t("okSaved")}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border-2 border-highlight-red bg-paper p-3 text-sm text-ink">
            ❌ {error}
          </div>
        ) : null}
      </form>

      <h2 className="mt-8 text-base font-semibold text-ink font-kalam">
        {t("h2Feedback")}
      </h2>
      <ul className="list-disc pl-5">
        <li>{t("fbItem1")}</li>
        <li>{t("fbItem2")}</li>
        <li>{t("fbItem3")}</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-ink font-kalam">
        {t("h2Privacy")}
      </h2>
      <p>
        {t.rich("privacyText", {
          link: (chunks) => (
            <Link href="/privacy" className="underline decoration-dotted hover:text-ink">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </StaticPageShell>
  );
}
