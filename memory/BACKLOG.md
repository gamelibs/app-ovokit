# OVOFROGE 任务看板

> 本文件记录当前阶段任务状态。每次会话开始前/结束后更新。
> 当前阶段目标见 `memory/GOALS.md`。

---

## In Progress

- [ ] **母型与核心原型的映射 + 母型详情页展示**
  - 目标：在母型详情页展示每个母型所属的核心原型
  - 文件：`src/lib/archetypes/archetypes.ts`、`src/features/archetypes/pageModel.ts`、`src/components/archetypes/ArchetypePage.tsx`
  - 负责人：Kimi Code CLI
  - 开始时间：待定

- [ ] **母型图片资源填充**
  - 说明：管理后台 `/mod/archetypes/[key]/edit` 已支持上传/删除，等待用户上传素材
  - 状态：阻塞（等待用户素材）

- [ ] **核心玩法图片资源填充**
  - 说明：管理后台 `/mod/patterns/[key]/edit` 已支持上传/删除，等待用户上传素材
  - 状态：阻塞（等待用户素材）

---

## Todo

### 核心原型架构

- [x] 新增 5 种核心玩法原型数据层与筛选（2026-06-14 完成）
- [x] 5 种核心原型最小 Demo + 嵌入页面 + 详情页回退（2026-06-14 完成）
- [x] 5 种核心玩法原型内容文件化（`content/patterns/<key>/meta.json` + `src/lib/patterns/spec.ts`）（2026-06-20 完成）
- [x] 版主母型管理后台：`/mod/archetypes` 列表、`/mod/archetypes/[key]/edit` 编辑、保存 API（2026-06-20 完成）
- [x] 母型图片上传 API：`/api/mod/archetypes/[key]/images`（2026-06-20 完成）
- [x] 扩展核心玩法 schema 并生成 5 种详细内容（2026-06-20 完成）
- [x] 版主核心玩法管理后台：`/mod/patterns` 列表、`/mod/patterns/[key]/edit` 编辑、保存 API（2026-06-20 完成）
- [x] 核心玩法图片上传 API：`/api/mod/patterns/[key]/images`（2026-06-20 完成）
- [x] 核心玩法预览页 `/patterns` + `/patterns/[key]`（2026-06-20 完成）
- [x] 首页「核心玩法原型」快捷入口与顶部分组链接（2026-06-20 完成）
- [x] 玩法特征内容文件化：`content/features/<key>/meta.json`（2026-06-20 完成）
- [x] 玩法特征管理后台 `/mod/features` + 编辑保存 API（2026-06-20 完成）
- [x] 玩法特征图片上传 API `/api/mod/features/[key]/images`（2026-06-20 完成）
- [x] 玩法特征预览页 `/features` + 首页入口（2026-06-20 完成）
- [x] 首页 Hero 价值主张优化（2026-06-20 完成）
- [x] 核心玩法流程图 SVG 与页面展示（2026-06-20 完成）
- [x] 图片上传自动压缩到常用显示尺寸（2026-06-20 完成）
- [x] 全站品牌名从 OVOKIT 改为 OVOFROGE（2026-06-20 完成）
- [x] ServerDemoPlayer 自适应布局、自动 tick、手绘风格统一（2026-06-14 完成）
- [ ] 建立母型与核心原型的映射（`archetypeToPatterns`）
- [ ] 母型详情页展示所属核心原型
- [ ] 版主发帖表单：选择原型后自动生成 breakdown / code 骨架
- [ ] AI 分析工具识别并输出 `pattern` 字段

### 工程化

- [ ] 修复 `useBlockEditor.ts` 中 `commit` 提前访问 bug
- [ ] 分批治理 Lint errors（优先 errors）
- [ ] 考虑把统计持久化从文件系统迁到 Redis/DB

### 体验

- [x] 补齐玩法帖子封面 SVG（程序化 RoughJS 批量生成 30 个帖子的 cover/coverWide，AI 模式可选）
- [ ] 优化联系表单通知（邮件/webhook）
- [ ] 完善搜索高亮与空状态

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

---

## 归档规则

完成的任务从 **In Progress / Todo** 移到 **Done**，保留 2-4 周；超过一个月的 Done 项可删除或移入 `memory/archive/BACKLOG-YYYY-MM.md`。
