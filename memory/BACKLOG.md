# OVOFORGE 任务看板

> 本文件记录当前阶段任务状态。每次会话开始前/结束后更新。
> 当前阶段目标见 `memory/GOALS.md`。
> 机器可读元数据：任务标题后的 `<!-- task:id=... priority:P0|P1|P2 category:... -->` 供 `scripts/agent-task-runner.ts` 解析。

---

---

## Todo

### 阻塞项（P0 必须）

- [x] **生产服务器 Docker 部署** <!-- task:id=deploy-001 priority:P0 category:engineering -->
  - 文件：`doc/docker-deployment.md`、`Dockerfile`、`docker-compose.yml`
  - 目标：在目标服务器上通过 Docker Compose 拉起 `ovoforge-web` 与 `ovoforge-algo` 容器，宿主 Nginx 反向代理到 127.0.0.1:13100
  - 验收：✅ `curl https://ovoforge.com/` 返回 200；`curl http://127.0.0.1:14100/health` 返回 OK

### 内容补齐

- [x] **补齐 12 个母型说明图** <!-- task:id=images-001 priority:P0 category:content -->
  - 验收：✅ 已生成 48 张 SVG 到 `public/archetypes/<key>/`
- [x] **补齐 5 种核心玩法说明图** <!-- task:id=images-002 priority:P0 category:content -->
  - 验收：✅ 已生成 20 张 SVG 到 `public/patterns/<key>/`（含已有 loop.svg）
- [x] **补齐 9 个玩法特征说明图** <!-- task:id=images-003 priority:P0 category:content -->
  - 验收：✅ 已生成 36 张 SVG 到 `public/features/<key>/`
- [ ] **独立详情页（P1 预留，P0 不实施）** <!-- task:id=detail-001 priority:P1 category:future -->
  - 目标：未来把 `/archetypes/[key]`、`/patterns/[key]` 重定向改为独立页面
  - 验收：P0 不验收

### 工程化与体验优化

- [ ] **关键路径 `<img>` 迁移到 `next/image`** <!-- task:id=perf-001 priority:P1 category:engineering -->
  - 文件：`src/components/plays/PlayStats.tsx`、`src/components/plays/RelatedPlays.tsx`、`src/app/(site)/play/[slug]/page.tsx`
  - 目标：替换原生 img 为 next/image，提升 LCP
  - 验收：`pnpm lint` 无 `@next/next/no-img-element` error
- [x] **处理外部 CDN 字体依赖** <!-- task:id=perf-002 priority:P1 category:engineering -->
  - 文件：`src/app/layout.tsx`、`src/app/globals.css`
  - 目标：评估并移除或内联 `lxgw-wenkai-webfont` jsDelivr 链接
  - 验收：✅ 已移除 jsDelivr CDN 链接和未使用的 `--font-wenkai` 变量
- [x] **实现自动优化推进任务模式工作流** <!-- task:id=workflow-001 priority:P0 category:engineering -->
  - 文件：`scripts/agent-task-runner.ts`、`package.json`、`doc/agent-task-runner.md`
  - 目标：Agent 启动时可运行 `pnpm agent:next` 获取下一任务 prompt
  - 验收：✅ `pnpm agent:dry` 能正确输出最高优先级任务；`pnpm agent:next` 将其标记为 In Progress 并输出 prompt

### 后续（P1/P2）

- [ ] **版主发帖表单：选择原型后自动生成 breakdown / code 骨架** <!-- task:id=future-001 priority:P2 category:future -->
- [ ] **AI 分析工具识别并输出 `pattern` 字段** <!-- task:id=future-002 priority:P2 category:future -->
- [ ] **优化联系表单通知（邮件/webhook）** <!-- task:id=future-003 priority:P2 category:future -->
- [ ] **完善搜索高亮与空状态** <!-- task:id=future-004 priority:P2 category:future -->
- [ ] **文档持续维护** <!-- task:id=doc-001 priority:P2 category:future -->
  - 目标：每次重大功能变更后同步更新 `doc/` 与 `memory/`

---

## Done

- [x] 建立 Agent 工作流记忆系统（`memory/`、`doc/AGENT_WORKFLOW.md`）
- [x] 手绘风格化基本完成
- [x] 30 篇玩法内容填充
- [x] 12 种母型文案填充
- [x] 三消 Demo 可玩
- [x] 12 个母型 Demo 可玩
- [x] 版主登录/发帖/编辑/发布/删除流程
- [x] AI 分析/封面/流程图/示意图工具
- [x] `pnpm typecheck` / `pnpm build` 通过
- [x] 新增 5 种核心玩法原型数据层与筛选（2026-06-14）
- [x] 5 种核心原型最小 Demo + 嵌入页面 + 详情页回退（2026-06-14）
- [x] 补齐玩法帖子封面 SVG（程序化 RoughJS 批量生成 30 个帖子的 cover/coverWide，AI 模式可选）（2026-06-21）
- [x] 上线前综合评估（正确性/稳定性/内容/交互/安全/合规/性能/运维）（2026-06-21）
- [x] 治理 lint errors（122 → 0）（2026-06-21）
- [x] 建立母型与核心原型的映射并在详情页展示（2026-06-21）
- [x] 程序化生成母型/原型/特征说明图 104 张（2026-06-21）
- [x] API 频率限制（view/like/contact/login）（2026-06-21）
- [x] 整理 Git 工作区并提交上线版本（2026-06-21）
- [x] 最终上线前验证通过（2026-06-21）
- [x] 移除外部 CDN 字体依赖（2026-06-21）
- [x] 版主鉴权安全加固（HMAC-SHA256 签名 cookie）（2026-06-21）
- [x] 修复 block-editor `commit` 提前访问运行时 bug（2026-06-21）
- [x] 统计持久化迁移到 Upstash Redis（保留文件系统 fallback）（2026-06-21）
- [x] 实现自动优化推进任务模式工作流（`scripts/agent-task-runner.ts`）（2026-06-21）
- [x] 编写生产服务器部署清单 `doc/server-deployment-checklist.md`（2026-06-21）
- [x] 实现服务器部署检查脚本 `scripts/deploy-check.sh`（2026-06-21）
- [x] 新增 PM2 web 生产配置 `ecosystem.web.config.js`（2026-06-21）
- [x] 创建 GitHub Actions 自动部署工作流 `.github/workflows/deploy.yml`（2026-06-21）
- [x] 删除无用资源 `imgs/`、默认 public SVG、`.DS_Store`（2026-06-21）
- [x] 更新 `compress-images` / `generate-play-covers` 脚本与文档，移除 `imgs/` 引用（2026-06-21）
- [x] 删除 `comfyui/` 工作流目录并更新 README / `AGENTS.md` / `doc/AGENT_CONTEXT.md`（2026-06-21）
- [x] 修复 hydration mismatch：全屏按钮、Cookie 横幅、搜索框、GA 加载等客户端 API 改为 hydration 安全初始化（2026-06-21）
- [x] 新增全站 smoke test `scripts/smoke-test.ts`，68 个页面全部通过（2026-06-21）
- [x] 整理 `doc/` 目录：归档过时文档、刷新 V1/V2/开发说明/手绘风格契约/版主工作流/AGENT 文档、新增 `doc/README.md`（2026-06-21）
- [x] 新增 Docker 部署方案：`Dockerfile`、`docker-compose.yml`、`.dockerignore`、`doc/docker-deployment.md`（2026-06-21）

---

## 归档规则

完成的任务从 **In Progress / Todo** 移到 **Done**，保留 2-4 周；超过一个月的 Done 项可删除或移入 `memory/archive/BACKLOG-YYYY-MM.md`。
