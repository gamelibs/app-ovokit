# OVOFORGE 任务看板

> 本文件记录当前阶段任务状态。每次会话开始前/结束后更新。
> 当前阶段目标见 `memory/GOALS.md`。
> 机器可读元数据：任务标题后的 `<!-- task:id=... priority:P0|P1|P2 category:... -->` 供 `scripts/agent-task-runner.ts` 解析。

---

---

## In Progress

- [ ] **移动端玩法详情页结构优化** <!-- task:id=mobile-detail-001 priority:P1 category:ux -->
  - 文件：`src/app/(site)/play/[slug]/page.tsx`
  - 目标：移动端首屏（标题卡）之后直接展示 Demo，移除移动端封面图片占位；PC 端保持「玩法拆解 → 关键代码 → Demo」顺序
  - 状态：已改待用户确认后提交部署

- [ ] **手绘边框减淡调优** <!-- task:id=ui-border-001 priority:P1 category:ux -->
  - 文件：`src/components/sketch/SketchBorder.tsx`、`src/components/sketch/SketchCard.tsx`、`src/app/globals.css`
  - 目标：降低卡片/分隔线边框存在感，避免抢夺内容焦点；顶部导航、底部、主按钮保持重色锚点
  - 状态：已改待用户确认后提交部署

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

  - 文件：`src/app/(site)/archetypes/[key]/page.tsx`、`src/app/(site)/patterns/[key]/page.tsx`、`src/app/(site)/features/[key]/page.tsx` 及相关 Tab/收藏/后台链接
  - 目标：把重定向改为独立 SSG 详情页，释放 SEO 价值
  - 验收：✅ `/archetypes/[key]`、`/patterns/[key]`、`/features/[key]` 直接返回 200，有独立 metadata

### 工程化与体验优化


  - 文件：`src/components/plays/PlayCard.tsx`、`src/components/home/HotPlaysSection.tsx`、`src/components/home/PlayListItem.tsx`、`src/components/plays/RelatedPlays.tsx`、`src/app/(site)/play/[slug]/page.tsx`
  - 目标：替换原生 img 为 next/image，提升 LCP/CLS
  - 验收：✅ `pnpm lint` 0 errors；核心路径 no-img-element warnings 清除
- [x] **处理外部 CDN 字体依赖** <!-- task:id=perf-002 priority:P1 category:engineering -->
  - 文件：`src/app/layout.tsx`、`src/app/globals.css`
  - 目标：评估并移除或内联 `lxgw-wenkai-webfont` jsDelivr 链接
  - 验收：✅ 已移除 jsDelivr CDN 链接和未使用的 `--font-wenkai` 变量
- [x] **实现自动优化推进任务模式工作流** <!-- task:id=workflow-001 priority:P0 category:engineering -->
  - 文件：`scripts/agent-task-runner.ts`、`package.json`、`doc/agent-task-runner.md`
  - 目标：Agent 启动时可运行 `pnpm agent:next` 获取下一任务 prompt
  - 验收：✅ `pnpm agent:dry` 能正确输出最高优先级任务；`pnpm agent:next` 将其标记为 In Progress 并输出 prompt

### 后续（P1/P2）

- [ ] **H5 试玩 Demo 体系重构** <!-- task:id=demo-h5-001 priority:P1 category:product -->
  - 文件：`doc/h5-demo-development-guide.md`、外部 Demo 仓库
  - 目标：将 12 母型 + 5 核心原型 Demo 改为外部 H5 实现，按 demoId 映射加载；玩法帖子逐步接入专用 H5 Demo
  - 状态：规范已输出，待外部工具创作实现

- [ ] **版主发帖表单：选择原型后自动生成 breakdown / code 骨架** <!-- task:id=future-001 priority:P2 category:future -->
- [ ] **AI 分析工具识别并输出 `pattern` 字段** <!-- task:id=future-002 priority:P2 category:future -->

  - 文件：`src/app/(site)/api/contact/route.ts`、`.env.example`、`doc/邮件功能说明.md`
  - 目标：保存留言后异步发送 Webhook 到 Slack/Discord/飞书/企业微信等
  - 验收：✅ 配置 CONTACT_WEBHOOK_URL 后可收到实时通知，未配置时不影响提交
- [ ] **文档持续维护** <!-- task:id=doc-001 priority:P2 category:future -->
  - 目标：每次重大功能变更后同步更新 `doc/` 与 `memory/`

---

## Done

- [x] **清理全站用户可见的内部占位/提示文案** <!-- task:id=cleanup-internal-hints-001 priority:P0 category:content -->
  - 文件：`content/plays/*/meta.json`、`src/app/(site)/play/[slug]/page.tsx`、`src/components/demos/PlayMiniDemo.tsx`、`src/components/mod/NewPlayForm.tsx`、`src/lib/content/plays.ts`
  - 目标：删除玩法详情页 Demo 区"建议 Demo"、"MVP 占位"、文章区"不支持自定义组件"、技术栈 `(占位)`、`PlayMiniDemo` 开发者提示等用户不应看到的内部文案；同时把 `NewPlayForm` 默认占位文本置空，避免新内容继续污染
  - 验收：✅ `pnpm typecheck` 通过；`pnpm lint` 0 errors / 30 warnings；`pnpm test:smoke` 68/68 通过（2026-06-23）

- [x] **关键路径 `<img>` 迁移到 `next/image`** <!-- task:id=perf-001 priority:P1 category:engineering -->
  - 文件：`src/components/plays/PlayCard.tsx`、`src/components/home/HotPlaysSection.tsx`、`src/components/home/PlayListItem.tsx`、`src/components/plays/RelatedPlays.tsx`、`src/app/(site)/play/[slug]/page.tsx`
  - 目标：替换原生 img 为 next/image，提升 LCP/CLS
  - 验收：✅ `pnpm lint` 0 errors；核心路径 no-img-element warnings 清除（2026-06-21）
- [x] **联系表单 Webhook 实时通知** <!-- task:id=future-003 priority:P1 category:engineering -->
  - 文件：`src/app/(site)/api/contact/route.ts`、`.env.example`、`doc/邮件功能说明.md`
  - 目标：保存留言后异步发送 Webhook 到 Slack/Discord/飞书/企业微信等
  - 验收：✅ 配置 CONTACT_WEBHOOK_URL 后可收到实时通知，未配置时不影响提交（2026-06-21）
- [x] **独立详情页** <!-- task:id=detail-001 priority:P1 category:engineering -->
  - 文件：`src/app/(site)/archetypes/[key]/page.tsx`、`src/app/(site)/patterns/[key]/page.tsx`、`src/app/(site)/features/[key]/page.tsx` 及相关 Tab/收藏/后台链接
  - 目标：把重定向改为独立 SSG 详情页，释放 SEO 价值
  - 验收：✅ `/archetypes/[key]`、`/patterns/[key]`、`/features/[key]` 直接返回 200，有独立 metadata（2026-06-21）
- [x] **搜索体验第一层优化** <!-- task:id=future-004 priority:P1 category:engineering -->
  - 文件：`src/lib/content/plays.ts`、`src/lib/search/match.ts`、`src/lib/search/highlight.tsx`、`src/components/search/SearchSuggestions.tsx`、`src/components/site/TopNav.tsx`、`src/components/plays/PlayCard.tsx`、`src/app/(site)/page.tsx`
  - 目标：扩展搜索字段（title/subtitle/tags/techStack/corePoints/breakdown/codeSnippets/demo.note/article.mdx），增加热门搜索建议下拉，搜索结果高亮，无结果时推荐热门词与最新文章
  - 验收：✅ `pnpm typecheck`/`pnpm lint`/`pnpm build` 通过；搜索"三消"可命中 Match-3 文章（2026-06-21）
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
