import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { google } from "googleapis";

const code = process.argv[2];

if (!code) {
  console.error("用法: pnpm tsx scripts/gmail-exchange-code.ts <code>");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:13100",
);

oauth2Client
  .getToken(code)
  .then(({ tokens }) => {
    if (!tokens.refresh_token) {
      console.error("没有返回 refresh_token。请先在 Google 账号中移除该应用授权，然后重新授权。");
      process.exit(1);
    }
    console.log("\nGOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
  })
  .catch((e) => {
    console.error("获取 token 失败:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
