#!/usr/bin/env node
/**
 * Agent 自动任务推进器
 *
 * 工作方式：
 * 1. 读取 memory/BACKLOG.md 与 memory/STATUS.md
 * 2. 按优先级与阻塞关系挑选下一个任务
 * 3. 将任务标记为 In Progress（可选 --dry-run 预览）
 * 4. 输出完整 prompt，供当前 Agent 直接执行
 *
 * 默认是半自主模式：只输出 prompt，不自动调用子进程修改代码。
 * 可选 --mode=auto --execute 调用 kimi CLI（需显式开启，不推荐 P0）。
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ROOT = process.cwd();
const BACKLOG_PATH = path.join(ROOT, "memory", "BACKLOG.md");
const STATUS_PATH = path.join(ROOT, "memory", "STATUS.md");
const DAILY_DIR = path.join(ROOT, "memory", "daily");

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 } as const;
const CATEGORY_ORDER = {
  blocker: 0,
  content: 1,
  engineering: 2,
  future: 3,
} as const;

type Priority = keyof typeof PRIORITY_ORDER;
type Category = keyof typeof CATEGORY_ORDER;
type TaskState = "todo" | "in-progress" | "done";

interface Task {
  id: string;
  rawId: string;
  title: string;
  priority: Priority;
  category: Category;
  state: TaskState;
  files: string[];
  goal: string;
  acceptance: string;
  blockedBy: string[];
  lineStart: number;
  lineEnd: number;
}

interface Options {
  dryRun: boolean;
  taskId?: string;
  mode: "semi" | "auto";
  execute: boolean;
  skipMemoryUpdate: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const opts: Options = {
    dryRun: false,
    mode: "semi",
    execute: false,
    skipMemoryUpdate: false,
  };

  for (const arg of args) {
    if (arg === "--dry-run" || arg === "-d") {
      opts.dryRun = true;
    } else if (arg === "--execute" || arg === "-e") {
      opts.execute = true;
    } else if (arg === "--skip-memory-update") {
      opts.skipMemoryUpdate = true;
    } else if (arg.startsWith("--task-id=")) {
      opts.taskId = arg.slice("--task-id=".length);
    } else if (arg.startsWith("--mode=")) {
      const mode = arg.slice("--mode=".length);
      if (mode === "semi" || mode === "auto") {
        opts.mode = mode;
      }
    }
  }

  return opts;
}

function extractMeta(line: string): Partial<Pick<Task, "id" | "priority" | "category" | "blockedBy">> {
  const meta: ReturnType<typeof extractMeta> = {};
  const commentMatch = /<!--\s*(.*?)\s*-->/.exec(line);
  if (!commentMatch) return meta;

  const content = commentMatch[1];

  const idMatch = /task:id=([^\s]+)/.exec(content);
  if (idMatch) meta.id = idMatch[1];

  const priorityMatch = /priority:(P0|P1|P2)/.exec(content);
  if (priorityMatch) meta.priority = priorityMatch[1] as Priority;

  const categoryMatch = /category:(blocker|content|engineering|future)/.exec(content);
  if (categoryMatch) meta.category = categoryMatch[1] as Category;

  const blockedByMatch = /blockedBy:([^\s]+)/.exec(content);
  if (blockedByMatch) {
    meta.blockedBy = blockedByMatch[1].split(",").filter(Boolean);
  }

  return meta;
}

function generateId(title: string, index: number): string {
  const slug = title
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 32);
  return `${slug || "task"}-${index}`;
}

function parseBacklog(raw: string): Task[] {
  const lines = raw.split("\n");
  const tasks: Task[] = [];
  let current: Partial<Task> | null = null;
  let lineStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const checkboxMatch = /^(\s*)- \[([ x])\] \*\*(.+)\*\*/.exec(line);

    if (checkboxMatch) {
      if (current) {
        current.lineEnd = i - 1;
        tasks.push(current as Task);
      }

      const state: TaskState = checkboxMatch[2] === "x" ? "done" : "todo";
      const title = checkboxMatch[3].trim();
      const meta = extractMeta(line);

      current = {
        rawId: meta.id ?? "",
        title,
        state,
        priority: meta.priority ?? "P2",
        category: meta.category ?? "future",
        blockedBy: meta.blockedBy ?? [],
        files: [],
        goal: "",
        acceptance: "",
        lineStart: i,
        lineEnd: i,
      };
      lineStart = i;
    } else if (current && line.trim().startsWith("- ")) {
      const trimmed = line.trim().slice(2).trim();
      if (trimmed.startsWith("文件：")) {
        const filesText = trimmed.slice("文件：".length);
        current.files = filesText.split(/[,，]/).map((f) => f.trim()).filter(Boolean);
      } else if (trimmed.startsWith("目标：")) {
        current.goal = trimmed.slice("目标：".length).trim();
      } else if (trimmed.startsWith("验收：") || trimmed.startsWith("验收标准：")) {
        current.acceptance = trimmed.replace(/^验收标准：|^验收：/, "").trim();
      }
    }
  }

  if (current) {
    current.lineEnd = lines.length - 1;
    tasks.push(current as Task);
  }

  return tasks.map((t, idx) => ({
    ...t,
    id: t.rawId || generateId(t.title, idx),
  }));
}

function findTaskBoundaries(raw: string, targetId: string): { start: number; end: number; stateLine: number; state: TaskState } | null {
  const lines = raw.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const checkboxMatch = /^(\s*)- \[([ x])\] \*\*(.+)\*\*/.exec(line);
    if (!checkboxMatch) continue;

    const title = checkboxMatch[3].trim();
    const meta = extractMeta(line);
    const id = meta.id || generateId(title, i);

    if (id === targetId) {
      return {
        start: i,
        end: i,
        stateLine: i,
        state: checkboxMatch[2] === "x" ? "done" : "todo",
      };
    }
  }

  return null;
}

async function updateTaskState(raw: string, targetId: string, newState: TaskState): Promise<string> {
  const boundaries = findTaskBoundaries(raw, targetId);
  if (!boundaries) {
    throw new Error(`Task ${targetId} not found in backlog`);
  }

  const lines = raw.split("\n");
  const line = lines[boundaries.stateLine];
  const newLine = line.replace(/- \[[ x]\]/, newState === "done" ? "- [x]" : "- [ ]");
  lines[boundaries.stateLine] = newLine;
  return lines.join("\n");
}

function pickNextTask(tasks: Task[], opts: Options): Task | null {
  if (opts.taskId) {
    return tasks.find((t) => t.id === opts.taskId) || null;
  }

  const inProgress = tasks.find((t) => t.state === "in-progress");
  if (inProgress) {
    return inProgress;
  }

  return tasks
    .filter((t) => t.state === "todo")
    .filter((t) => t.blockedBy.every((id) => tasks.some((done) => done.id === id && done.state === "done")))
    .sort((a, b) => {
      if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      return CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    })[0] || null;
}

function buildPrompt(task: Task): string {
  const files = task.files.length ? task.files.join("\n- ") : "（根据目标自行定位）";

  return `
你是一个 Next.js + TypeScript 全栈专家。请认领并独立完成以下任务。

## 任务信息

- ID：${task.id}
- 标题：${task.title}
- 优先级：${task.priority}
- 分类：${task.category}
- 当前状态：${task.state === "in-progress" ? "进行中" : "待开始"}

## 目标

${task.goal || task.title}

## 验收标准

${task.acceptance || "完成目标描述中的功能/修复，并确保 pnpm typecheck 与 pnpm build 通过。"}

## 相关文件

- ${files}

## 工作流约束

1. 开始前先读取 memory/STATUS.md、memory/BACKLOG.md、memory/GOALS.md 获取上下文。
2. 做最小可验证改动，避免无关重构和大范围格式化。
3. 修改后必须运行：
   - pnpm typecheck
   - pnpm build
   - 如修改了代码风格，运行 pnpm lint
4. 任务完成后更新：
   - memory/BACKLOG.md（将本任务移到 Done）
   - memory/STATUS.md（更新状态/阻塞/健康检查）
   - memory/daily/YYYY-MM-DD.md（记录当日工作）
5. 不要主动运行 git commit / git push，除非用户明确允许。
6. 如果遇到阻塞或需求不清，先向用户确认，不要假设。

请开始实施。
`.trim();
}

async function appendDailyNote(task: Task, status: "started" | "done"): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = path.join(DAILY_DIR, `${today}.md`);

  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    raw = `# ${today} 工作笔记\n\n`;
  }

  const entry = status === "started"
    ? `- 开始任务 **${task.title}**（${task.id}）`
    : `- 完成任务 **${task.title}**（${task.id}）`;

  if (!raw.includes(entry)) {
    raw += `\n${entry}\n`;
    await fs.mkdir(DAILY_DIR, { recursive: true });
    await fs.writeFile(filePath, raw, "utf8");
  }
}

async function runKimiCli(prompt: string): Promise<void> {
  const kimi = process.env.KIMI_CLI_PATH || "kimi";
  return new Promise((resolve, reject) => {
    const child = spawn(kimi, ["-p", prompt], {
      stdio: "inherit",
      cwd: ROOT,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Kimi CLI exited with ${code}`));
    });
  });
}

async function main(): Promise<void> {
  const opts = parseArgs();

  const [backlogRaw, statusRaw] = await Promise.all([
    fs.readFile(BACKLOG_PATH, "utf8"),
    fs.readFile(STATUS_PATH, "utf8").catch(() => ""),
  ]);

  const tasks = parseBacklog(backlogRaw);

  if (tasks.length === 0) {
    console.log("未解析到任何任务。请检查 memory/BACKLOG.md 格式。");
    return;
  }

  const inProgress = tasks.find((t) => t.state === "in-progress");

  if (inProgress && !opts.taskId) {
    console.log(`⚠️ 已有进行中的任务：${inProgress.id} — ${inProgress.title}`);
    console.log("如需继续该任务，请直接按下方 prompt 执行；");
    console.log(`如需强制切换任务，请使用 --task-id=<id>，例如 --task-id=${tasks.find((t) => t.state === "todo")?.id ?? ""}。`);
    console.log("\n" + "=".repeat(60));
    console.log(buildPrompt(inProgress));
    return;
  }

  const nextTask = pickNextTask(tasks, opts);

  if (!nextTask) {
    console.log("✅ 没有可推进的未阻塞任务。所有 P0/P1 任务均已完成或阻塞。");
    return;
  }

  if (nextTask.state === "done") {
    console.log(`任务 ${nextTask.id} 已完成。`);
    return;
  }

  if (opts.dryRun) {
    console.log("🔍 [Dry Run] 将认领任务：");
    console.log(`  ID: ${nextTask.id}`);
    console.log(`  标题: ${nextTask.title}`);
    console.log(`  优先级: ${nextTask.priority}`);
    console.log(`  分类: ${nextTask.category}`);
    console.log(`  文件: ${nextTask.files.join(", ") || "（无）"}`);
    console.log(`  目标: ${nextTask.goal || "（无）"}`);
    return;
  }

  if (!opts.skipMemoryUpdate) {
    const newBacklog = await updateTaskState(backlogRaw, nextTask.id, "in-progress");
    await fs.writeFile(BACKLOG_PATH, newBacklog, "utf8");
    await appendDailyNote(nextTask, "started");
    console.log(`📝 已将任务 ${nextTask.id} 标记为 In Progress。`);
  }

  const prompt = buildPrompt(nextTask);

  if (opts.mode === "auto" && opts.execute) {
    if (!process.env.KIMI_AUTO_RUN) {
      console.log("⚠️ 自动执行需设置环境变量 KIMI_AUTO_RUN=1。");
      console.log("本次仅输出 prompt，请复制到 Agent 执行。\n");
      console.log(prompt);
      return;
    }
    console.log("🚀 自动调用 kimi CLI 执行任务...");
    await runKimiCli(prompt);
    console.log("✅ 子任务返回。请检查结果并手动标记任务状态。");
  } else {
    console.log("\n" + "=".repeat(60));
    console.log(prompt);
    console.log("=".repeat(60));
    console.log("\n💡 提示：复制上方 prompt 给当前 Agent，或运行 --mode=auto --execute（需 KIMI_AUTO_RUN=1）。");
  }
}

main().catch((err) => {
  console.error("❌ 任务推进器出错：", err instanceof Error ? err.message : err);
  process.exit(1);
});
