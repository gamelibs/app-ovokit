import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { siteConfig } from "@/lib/site/config";
import { rateLimitByIp, RATE_LIMITS } from "@/lib/rate-limit";

const CONTACT_DIR = path.join(process.cwd(), "content", "contact-messages");
const MAX_SUBJECT = 100;
const MAX_MESSAGE = 200;
const MIN_MESSAGE = 10;
const DEFAULT_EMAIL =
  process.env.CONTACT_TO_EMAIL ??
  siteConfig.contactEmail ??
  "h5gamelog@gmail.com";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function saveMessage(body: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    name: body.name.trim(),
    email: body.email.trim(),
    subject: body.subject.trim(),
    message: body.message.trim(),
    createdAt: new Date().toISOString(),
  };

  await fs.mkdir(CONTACT_DIR, { recursive: true });
  const filePath = path.join(CONTACT_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(entry, null, 2) + "\n", "utf8");
  return entry;
}

function buildRawEmail(payload: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}) {
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(payload.subject).toString(
    "base64",
  )}?=`;
  const headers = [
    `From: ${payload.from}`,
    `To: ${payload.to}`,
    `Reply-To: ${payload.replyTo}`,
    `Subject: ${subjectEncoded}`,
    `Content-Type: text/html; charset=utf-8`,
    "MIME-Version: 1.0",
  ];
  const body = payload.html;
  const raw = [...headers, "", body].join("\r\n");
  return Buffer.from(raw).toString("base64url");
}

async function sendWebhook(payload: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}) {
  const url = process.env.CONTACT_WEBHOOK_URL;
  if (!url) return { sent: false };

  const secret = process.env.CONTACT_WEBHOOK_SECRET;
  const body = {
    ...payload,
    source: "ovo-contact",
    site: siteConfig.url ?? "https://ovoforge.com",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Contact-Secret": secret } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "webhook 发送失败";
    console.error("[contact] webhook failed:", msg);
    return { sent: false };
  }
}

async function sendContactEmail(body: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const fromEmail = process.env.GOOGLE_SENDER_EMAIL ?? DEFAULT_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL ?? DEFAULT_EMAIL;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn("[contact] Google OAuth credentials not configured, email not sent");
    return { sent: false };
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:13100",
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#202020;">
      <h2 style="font-size:18px;">来自 OVO 联系表单的新留言</h2>
      <p><strong>姓名：</strong> ${escapeHtml(body.name)}</p>
      <p><strong>邮箱：</strong> ${escapeHtml(body.email)}</p>
      <p><strong>主题：</strong> ${escapeHtml(body.subject)}</p>
      <hr style="border:0;border-top:1px solid #ddd;" />
      <pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;">${escapeHtml(body.message)}</pre>
    </div>
  `;

  const raw = buildRawEmail({
    from: `"OVO 联系表单" <${fromEmail}>`,
    to: toEmail,
    replyTo: body.email,
    subject: `[OVO] ${body.subject}`,
    html,
  });

  console.log(`[contact] sending email via Gmail API to ${toEmail}`);

  const sendPromise = gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("邮件发送超时（15秒）")), 15000);
  });

  await Promise.race([sendPromise, timeoutPromise]);

  return { sent: true };
}

export async function POST(req: Request) {
  const { allowed, resetAt } = rateLimitByIp(req, RATE_LIMITS.contact);
  if (!allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  const { name, email, subject, message } = body;

  const resolvedName = (name ?? "访客").trim() || "访客";
  const resolvedEmail = (email ?? DEFAULT_EMAIL).trim() || DEFAULT_EMAIL;

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "主题和内容为必填项" },
      { status: 400 },
    );
  }

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();

  if (trimmedSubject.length > MAX_SUBJECT) {
    return NextResponse.json(
      { error: `主题不能超过 ${MAX_SUBJECT} 字` },
      { status: 400 },
    );
  }
  if (trimmedMessage.length < MIN_MESSAGE) {
    return NextResponse.json(
      { error: `内容至少需要 ${MIN_MESSAGE} 字` },
      { status: 400 },
    );
  }
  if (trimmedMessage.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `内容不能超过 ${MAX_MESSAGE} 字` },
      { status: 400 },
    );
  }
  if (/[<>]/.test(trimmedSubject) || /[<>]/.test(trimmedMessage)) {
    return NextResponse.json(
      { error: "主题或内容包含非法字符（如 < >）" },
      { status: 400 },
    );
  }

  const payload = {
    name: resolvedName,
    email: resolvedEmail,
    subject: trimmedSubject,
    message: trimmedMessage,
  };

  let entry: { id: string; createdAt: string };
  try {
    entry = await saveMessage(payload);
  } catch {
    return NextResponse.json({ error: "保存留言失败" }, { status: 500 });
  }
  const { id, createdAt } = entry;

  // 异步发送 webhook，失败不影响主流程
  sendWebhook({ id, ...payload, createdAt }).then((result) => {
    if (!result.sent) {
      console.log(`[contact] webhook skipped for message ${id}`);
    }
  });

  try {
    const { sent } = await sendContactEmail(payload);
    if (!sent) {
      console.log(`[contact] message saved locally (${id}), email skipped`);
    }
    return NextResponse.json({ ok: true, id, sent });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "发送邮件失败";
    console.error("[contact] email send failed:", msg);
    return NextResponse.json(
      { error: msg, id, saved: true },
      { status: 500 },
    );
  }
}
