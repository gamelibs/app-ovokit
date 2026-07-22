import { redirect } from "next/navigation";

/**
 * 「案例演示」已并入内容管理（/mod?filter=demo）。
 * 保留本路由仅作旧链接重定向。
 */
export default function ModCasesRedirect() {
  redirect("/mod?filter=demo");
}
