import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const subtitle = String(body.subtitle ?? "").trim();
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  const techStack = Array.isArray(body.techStack)
    ? body.techStack.filter((t): t is string => typeof t === "string")
    : [];
  const corePoints = Array.isArray(body.corePoints)
    ? body.corePoints.filter((t): t is string => typeof t === "string")
    : [];
  const breakdown = Array.isArray(body.breakdown)
    ? body.breakdown.filter(
        (s): s is { title: string; bullets: string[] } =>
          s !== null &&
          typeof s === "object" &&
          typeof (s as Record<string, unknown>).title === "string" &&
          Array.isArray((s as Record<string, unknown>).bullets),
      )
    : [];
  const codeSnippets = Array.isArray(body.codeSnippets)
    ? body.codeSnippets.filter(
        (s): s is { title: string; language: string; code: string } =>
          s !== null &&
          typeof s === "object" &&
          typeof (s as Record<string, unknown>).title === "string" &&
          typeof (s as Record<string, unknown>).language === "string" &&
          typeof (s as Record<string, unknown>).code === "string",
      )
    : [];

  const sections: string[] = [];

  sections.push(`# ${title || "玩法标题"}`);
  sections.push("");

  if (subtitle) {
    sections.push(subtitle);
    sections.push("");
  }

  if (tags.length > 0) {
    sections.push(`**标签**：${tags.join("、")}`);
    sections.push("");
  }

  if (techStack.length > 0) {
    sections.push("## 技术栈");
    sections.push("");
    techStack.forEach((t) => sections.push(`- ${t}`));
    sections.push("");
  }

  if (corePoints.length > 0) {
    sections.push("## 核心要点");
    sections.push("");
    corePoints.forEach((p) => sections.push(`- ${p}`));
    sections.push("");
  }

  if (breakdown.length > 0) {
    sections.push("## 玩法拆解");
    sections.push("");
    breakdown.forEach((section) => {
      sections.push(`### ${section.title}`);
      sections.push("");
      if (section.bullets.length > 0) {
        section.bullets.forEach((b) => sections.push(`- ${b}`));
        sections.push("");
      }
    });
  }

  if (codeSnippets.length > 0) {
    sections.push("## 代码实现");
    sections.push("");
    codeSnippets.forEach((snippet) => {
      sections.push(`### ${snippet.title}`);
      sections.push("");
      sections.push(`\`\`\`${snippet.language}`);
      sections.push(snippet.code);
      sections.push("```");
      sections.push("");
    });
  }

  sections.push("## 总结");
  sections.push("");
  sections.push(`${title || "本玩法"} 通过 ${techStack.slice(0, 2).join("、") || "核心技术"} 实现了 ${subtitle || "目标体验"}。`);
  sections.push("");
  sections.push("> 本文由 OVOKIT 编辑器根据结构化数据自动生成，可根据需要自由修改。");

  return NextResponse.json({ article: sections.join("\n") });
}
