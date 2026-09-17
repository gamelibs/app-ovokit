import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // (embed) demo 页、api/ 路由、Next 内部资源与
  // 一切带扩展名的静态文件都不进入 locale 段。
  matcher: ["/((?!api|embed|_next|_vercel|.*\\..*).*)"],
};
