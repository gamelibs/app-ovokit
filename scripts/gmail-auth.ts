import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";
import * as readline from "node:readline";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri =
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:13100";

if (!clientId || !clientSecret) {
  console.error(
    "请先在 .env.local 中设置 GOOGLE_CLIENT_ID 与 GOOGLE_CLIENT_SECRET",
  );
  console.error("当前值:");
  console.error("  GOOGLE_CLIENT_ID:", clientId || "(未设置)");
  console.error("  GOOGLE_CLIENT_SECRET:", clientSecret ? "已设置" : "(未设置)");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/gmail.send"],
  prompt: "consent",
});

console.log("\n请在浏览器中打开以下链接并授权：");
console.log(authUrl);
console.log(
  "\n授权后，将地址栏中返回的 code 参数值粘贴到这里并按回车：",
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("code: ", async (rawCode) => {
  const code = rawCode.trim();
  if (!code) {
    console.error("code 不能为空");
    rl.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n授权成功，请将以下值填入 .env.local：");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token ?? ""}`);
    if (!tokens.refresh_token) {
      console.warn(
        "\n警告：没有返回 refresh_token。如果你之前已经授权过，请尝试在 Google 账号的" +
          "第三方应用权限中移除该应用，然后重新运行本脚本并选择 prompt=consent。",
      );
    }
  } catch (e) {
    console.error(
      "获取 token 失败:",
      e instanceof Error ? e.message : String(e),
    );
    process.exit(1);
  } finally {
    rl.close();
  }
});
