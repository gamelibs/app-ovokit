import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const fromEmail = process.env.GOOGLE_SENDER_EMAIL ?? "h5gamelog@gmail.com";
  const toEmail = process.env.CONTACT_TO_EMAIL ?? "h5gamelog@gmail.com";

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("缺少 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:13100",
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  console.log("1. 尝试用 refresh_token 换取 access_token...");
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log("2. access_token 获取成功:", credentials.access_token ? "OK" : "失败");
  } catch (e) {
    console.error("2. 换取 access_token 失败:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const subject = "[OVO] 测试邮件";
  const raw = Buffer.from(
    [
      `From: ${fromEmail}`,
      `To: ${toEmail}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      `Content-Type: text/html; charset=utf-8`,
      "",
      "<p>这是一封来自 OVO 联系表单的测试邮件。</p>",
    ].join("\r\n"),
  ).toString("base64url");

  console.log("3. 尝试发送测试邮件到", toEmail, "...");
  try {
    const sendPromise = gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("请求超时（15秒）")), 15000),
    );
    const res = await Promise.race([sendPromise, timeoutPromise]);
    console.log("4. 发送成功:", res.data);
  } catch (e) {
    console.error("4. 发送失败:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
