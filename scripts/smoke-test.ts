/**
 * 全站页面 smoke test
 *
 * 使用系统 Chrome（puppeteer-core）批量访问关键页面，检查：
 *   - HTTP 状态 200
 *   - 不存在未捕获异常（pageerror）
 *   - console.error 中无 React hydration 错误
 *   - 页面关键结构存在（<main> 或 <h1>）
 *
 * 用法：
 *   # 自动启动 web + algo 服务（默认）
 *   pnpm test:smoke
 *
 *   # 复用已运行的服务
 *   SMOKE_BASE_URL=http://localhost:13100 pnpm test:smoke --reuse
 */

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import puppeteer, { type ConsoleMessage, type Page } from "puppeteer-core";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:13100";
const ALGO_URL = process.env.SMOKE_ALGO_URL || "http://localhost:14100";
const REUSE = process.argv.includes("--reuse");

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

const BANNED_CONSOLE_PATTERNS = [
  /Hydration failed/i,
  /did not match/i,
  /Minified React error #418/i,
  /Minified React error #423/i,
  /Minified React error #425/i,
];

const KNOWN_CONSOLE_ALLOWLIST = [
  // Next.js dev 模式下热更新相关的 WebSocket 断开提示
  /WebSocket connection failed/i,
  /ws.*failed/i,
];

type TestResult = {
  route: string;
  status?: number;
  ok: boolean;
  errors: string[];
  durationMs: number;
};

async function findChrome(): Promise<string | undefined> {
  for (const p of CHROME_PATHS) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // ignore
    }
  }
}

async function isServerReady(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerReady(url)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`服务未在 ${timeoutMs}ms 内就绪：${url}`);
}

async function startServers(): Promise<{ stop: () => Promise<void> }> {
  if (REUSE) {
    console.log("→ 复用已运行服务");
    return { stop: async () => {} };
  }

  if (await isServerReady(BASE_URL)) {
    console.log("→ 检测到服务已运行，复用之（如需强制重启请关闭现有服务）");
    return { stop: async () => {} };
  }

  console.log("→ 启动 web + algo 服务...");
  const proc = spawn("bash", ["start_web.sh"], {
    cwd: process.cwd(),
    stdio: "pipe",
    detached: true,
  });

  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    try {
      process.kill(-proc.pid!, "SIGTERM");
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  };

  proc.stdout?.on("data", (data) => {
    const line = String(data).trim();
    if (line) console.log(`  [web] ${line}`);
  });
  proc.stderr?.on("data", (data) => {
    const line = String(data).trim();
    if (line) console.log(`  [web/err] ${line}`);
  });

  await waitForServer(BASE_URL, 120000);
  await waitForServer(ALGO_URL, 120000);
  console.log("→ 服务已就绪");

  return { stop };
}

async function collectRoutes(): Promise<string[]> {
  const routes: string[] = [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/archetypes",
    "/patterns",
    "/features",
    "/favorites",
    "/mod",
    "/demo/blocks",
    "/demo/match3",
  ];

  const addContentRoutes = async (dir: string, prefix: string) => {
    const root = path.join(process.cwd(), "content", dir);
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) routes.push(`${prefix}/${encodeURIComponent(e.name)}`);
      }
    } catch {
      // ignore missing dir
    }
  };

  await addContentRoutes("plays", "/play");

  const archetypes = [
    "match-clear",
    "dodge-avoid",
    "runner",
    "shoot-aim",
    "combat",
    "placement",
    "choice-strategy",
    "physics",
    "puzzle",
    "progression",
    "simulation",
    "timing",
  ];
  for (const key of archetypes) routes.push(`/archetypes/${key}`);

  const patterns = ["action", "spatial", "merge", "management", "strategy"];
  for (const key of patterns) routes.push(`/patterns/${key}`);

  const features = [
    "merge",
    "idle",
    "click",
    "grid",
    "levels",
    "numbers",
    "generation",
    "roguelike",
    "state-machine",
  ];
  for (const key of features) routes.push(`/features/${key}`);

  return routes;
}

async function testRoute(
  page: Page,
  route: string,
): Promise<TestResult> {
  const url = `${BASE_URL}${route}`;
  const errors: string[] = [];

  const onPageError = (err: unknown) => {
    errors.push(`pageerror: ${err instanceof Error ? err.message : String(err)}`);
  };
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (KNOWN_CONSOLE_ALLOWLIST.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text.slice(0, 500)}`);
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  const start = Date.now();
  let status: number | undefined;
  try {
    const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    status = res?.status() ?? 0;
    if (status !== 200) {
      errors.push(`HTTP ${status}`);
    }

    // 等待 React 完成 hydration（Next.js 页面会在 hydration 后渲染 main/h1）
    try {
      await page.waitForSelector("main, h1", { timeout: 10000 });
    } catch {
      errors.push("页面缺少 <main> 或 <h1> 结构");
    }

    // 额外检查 hydration 错误文本是否出现在 DOM 中（React 错误遮罩）
    const hasHydrationOverlay = await page.evaluate(() =>
      document.body.innerText.includes("Unhandled Runtime Error") ||
      document.body.innerText.includes("Hydration")
    );
    if (hasHydrationOverlay) {
      errors.push("页面出现 React Runtime / Hydration 错误遮罩");
    }
  } catch (err) {
    errors.push(`导航失败：${err instanceof Error ? err.message : String(err)}`);
  } finally {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }

  // 只要出现 hydration 相关错误，就标记为失败
  const hasHydrationError = errors.some((e) =>
    BANNED_CONSOLE_PATTERNS.some((re) => re.test(e))
  );

  return {
    route,
    status,
    ok: status === 200 && errors.length === 0 && !hasHydrationError,
    errors,
    durationMs: Date.now() - start,
  };
}

async function main() {
  const chromePath = await findChrome();
  if (!chromePath) {
    console.error("未找到系统 Chrome，请安装 Google Chrome 或 Chromium。");
    process.exit(1);
  }

  let server;
  try {
    server = await startServers();
  } catch (err) {
    console.error("启动服务失败：", err);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const routes = await collectRoutes();
  console.log(`\n→ 准备测试 ${routes.length} 个页面...\n`);

  const results: TestResult[] = [];
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const page = await browser.newPage();
    const result = await testRoute(page, route);
    results.push(result);
    await page.close();

    const marker = result.ok ? "✅" : "❌";
    console.log(`${marker} [${i + 1}/${routes.length}] ${route} (${result.durationMs}ms)`);
    for (const err of result.errors) {
      console.log(`   └─ ${err}`);
    }
  }

  await browser.close();
  await server.stop();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n───────────────────────────────`);
  console.log(`总页面数：${results.length}`);
  console.log(`通过：${results.length - failed.length}`);
  console.log(`失败：${failed.length}`);
  console.log(`───────────────────────────────\n`);

  if (failed.length > 0) {
    console.log("失败页面：");
    for (const r of failed) {
      console.log(`  - ${r.route}: ${r.errors.join("; ")}`);
    }
    process.exit(1);
  }

  console.log("🎉 所有页面均通过 smoke test");
}

main().catch((err) => {
  console.error("\n脚本执行失败：", err);
  process.exit(1);
});
