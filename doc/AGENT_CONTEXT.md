# AI/协作最小上下文（用于减少重复扫描）

目标：让新会话在不“全仓库重读”的前提下，快速定位入口、约定、与高频文件。

## 一句话定位

OVO 是一个 Next.js（App Router）+ 本地内容文件（`content/*`）驱动的“玩法技术实现分享站”MVP，并带一个 Fastify 算法/Demo 后端（`server/*`）。

## 新会话的推荐阅读顺序（高性价比）

1. `memory/STATUS.md`：项目当前状态、阻塞、健康检查
2. `memory/GOALS.md`：当前阶段目标与里程碑
3. `memory/BACKLOG.md`：任务看板与下一步
4. `memory/DECISIONS.md`：关键架构/产品决策
5. `doc/AGENT_WORKFLOW.md`：Agent 协作规范
6. `README.md`：MVP 能力、核心路由、运行方式
7. `doc/开发说明.md`：更细的目录分层约定、Route Group、Demo/Viewer 架构
8. `doc/server-deployment-checklist.md`：生产服务器部署、安全加固、CI/CD
9. `package.json`：脚本入口（`pnpm dev` / `pnpm typecheck` / `pnpm algo:dev` / `pnpm test:smoke`）

除非问题明确需要，不建议从 `src/`、`server/` 开始“全量扫读”。

## Agent 工作流记忆（新）

- 项目状态：`memory/STATUS.md`
- 阶段目标：`memory/GOALS.md`
- 任务看板：`memory/BACKLOG.md`
- 决策记录：`memory/DECISIONS.md`
- 工作规范：`doc/AGENT_WORKFLOW.md`
- 每日笔记：`memory/daily/YYYY-MM-DD.md`

## 仓库地图（只列高频入口）

- 前端路由与页面：`src/app/*`（App Router，含 `(site)` / `(embed)` Route Group）
- UI 组件：`src/components/*`
- 页面模型/业务聚合：`src/features/*`
- 内容读取与类型：`src/lib/content/*`、`src/lib/archetypes/*`
- 内容数据（按需读取）：`content/plays/<slug>/*`、`content/archetypes/<key>/*`、`content/patterns/<key>/*`、`content/features/<key>/*`
- 算法/Demo 后端：`server/*`
- 静态资源（按需读取）：`public/*`

## “流量/上下文”优化约定（默认策略）

### 默认不扫描（除非任务明确需要）

- `node_modules/`
- `public/`、`games/`、`ReferenceCase/`
- `content/`：只读与当前任务相关的 `slug/key` 那一小段目录

### 先精确定位，再打开文件

- 优先用 `rg` 在 `src/`、`server/`、`doc/` 内做定向搜索，再打开最相关的 1–3 个文件。
- 若需要新增/修改约定，先更新本文件（保持短小、可索引），再改具体实现。

### 保持“权威入口文件”稳定

- 约定与地图：`doc/AGENT_CONTEXT.md`
- Agent 工作流规范：`doc/AGENT_WORKFLOW.md`
- 项目状态/目标/任务：`memory/`（STATUS.md / GOALS.md / BACKLOG.md / DECISIONS.md）
- 开发/架构细节：`doc/开发说明.md`
- 文档索引：`doc/README.md`
- 面向使用者：`README.md`
- 生产部署：`doc/server-deployment-checklist.md`
- 邮件功能配置：`doc/邮件功能说明.md`
- 文章发布规范：`doc/文章发布规范.md`
- 版主工作流：`doc/版主工作流.md`
- 图片压缩脚本：`doc/图片压缩脚本说明.md`
- 玩法封面批量生成：`doc/玩法封面生成脚本说明.md`
- Kimi SVG 生成实现：`doc/Kimi_SVG_接入实现说明.md`

## 常用命令（本地）

- 开发：`pnpm dev`
- 类型检查：`pnpm typecheck`
- Lint：`pnpm lint`
- 算法/Demo 后端：`pnpm algo:dev`
- 全站 smoke test：`pnpm test:smoke`

## 需要你提供的信息（当任务不明确时再问）

- 要改的是前端页面、内容数据（`content/*`）、还是后端（`server/*`）？
- 目标路由/slug/key 是什么？
- 是否允许修改内容数据文件（`content/*`）与静态资源（`public/*`）？

