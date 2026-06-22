# OVOFORGE 项目状态

> 最后更新：2026-06-21
> 更新者：Kimi Code CLI

---

## 当前阶段

**基础一期（P0）上线交付完成**。所有 P0 阻塞项已修复，Git 工作区已清理，站点通过最终验证；已完成服务器部署清单、检查脚本、GitHub Actions 工作流，清理了无用资源，并修复了 hydration mismatch 问题，新增全站 smoke test，具备公开上线条件。

## 当前目标

1. **修复上线阻塞项**：✅ 已完成。
2. **补齐内容缺口**：✅ 已完成。
3. **体验与性能优化**：✅ 已完成 API 限流与 CDN 字体移除；`<img>` 迁移保留为 P1。
4. **工作流升级**：✅ 已完成自动任务推进脚本。
5. **整理 Git 工作区**：✅ 已分批提交，形成可追溯上线版本。
6. **部署准备**：✅ 已完成服务器部署清单、检查脚本、PM2 配置与 GitHub Actions 部署工作流。
7. **资源清理**：✅ 已完成。
8. **运行时稳定性**：✅ 已完成 hydration mismatch 修复与全站 smoke test。
9. **文档整理**：✅ 已归档过时文档、刷新 V1/V2/开发说明/手绘风格契约/版主工作流/AGENT_CONTEXT/AGENT_WORKFLOW，新增 `doc/README.md` 文档索引。
10. **Docker 化部署准备**：✅ 已新增 `Dockerfile`、`docker-compose.yml`、`.dockerignore` 与 `doc/docker-deployment.md`。

**下一步**：P1 体验优化（`<img>` 迁移 `next/image`、搜索高亮、联系表单通知等）。

---

## 已完成（Done）

- [x] 前端信息架构：首页、详情页、母型列表页、版主后台、嵌入页
- [x] 手绘风格系统：颜色令牌、字体、Sketch 组件
- [x] 30 篇玩法内容（meta.json + article.mdx）
- [x] 12 种母型玩法文案
- [x] 三消 Demo（match3）可玩
- [x] 12 个母型最小 Demo（通用 archetype viewer）
- [x] 5 种核心玩法原型数据层、Demo、嵌入页、详情页回退
- [x] 9 个玩法特征内容与管理机制
- [x] 浏览/喜欢统计（Redis 持久化 + 文件系统 fallback）
- [x] 版主登录、发帖、编辑、发布/下架、删除（鉴权已加固为 HMAC 签名 cookie）
- [x] AI 分析/封面/流程图/示意图工具（需 `MOONSHOT_API_KEY`）
- [x] sitemap / robots
- [x] 联系表单（本地落盘 + 可选 Gmail 发送）
- [x] `pnpm typecheck` 通过 / `pnpm build` 通过
- [x] `pnpm lint` 0 errors / 33 warnings
- [x] 全站品牌名从 `OVOKIT` 改为 `OVOFORGE`
- [x] 上线前综合评估完成
- [x] 自动优化推进任务模式工作流（`scripts/agent-task-runner.ts`）
- [x] 母型↔核心原型映射与详情页展示
- [x] 程序化生成母型/原型/特征说明图 104 张
- [x] API 频率限制（view/like/contact/login）
- [x] 移除外部 CDN 字体依赖
- [x] Git 工作区整理并提交上线版本
- [x] 最终上线前验证通过（首页/详情/母型/原型/特征/合规页/登录/统计均正常）
- [x] 编写生产服务器部署清单 `doc/server-deployment-checklist.md`（2026-06-21）
- [x] 实现服务器部署检查脚本 `scripts/deploy-check.sh`（2026-06-21）
- [x] 新增 PM2 web 生产配置 `ecosystem.web.config.js`（2026-06-21）
- [x] 创建 GitHub Actions 自动部署工作流 `.github/workflows/deploy.yml`（2026-06-21）
- [x] 删除无用资源 `imgs/`、默认 public SVG、`.DS_Store`（2026-06-21）
- [x] 更新 `compress-images` / `generate-play-covers` 脚本与文档，移除 `imgs/` 引用（2026-06-21）
- [x] 删除 `comfyui/` 工作流目录并更新 README / `AGENTS.md` / `doc/AGENT_CONTEXT.md`（2026-06-21）
- [x] 修复 hydration mismatch：全屏按钮、Cookie 横幅、搜索框、GA 加载等客户端 API 改为 hydration 安全初始化（2026-06-21）
- [x] 新增全站 smoke test `scripts/smoke-test.ts`，68 个页面全部通过（2026-06-21）
- [x] 归档过时文档 `doc/站点风格说明.md` 到 `doc/archive/`（2026-06-21）
- [x] 刷新 `OVOKIT_V1_生产级实施方案.md` 为上线总结（2026-06-21）
- [x] 刷新 `OVOKIT_V2_战略白皮书_2026.md` 当前基线与四层内容模型（2026-06-21）
- [x] 刷新 `开发说明.md` 内容模型与路由描述（2026-06-21）
- [x] 刷新 `手绘风格契约.md` 待决策项为已决策项（2026-06-21）
- [x] 刷新 `版主工作流.md` 鉴权描述为 HMAC 签名 Cookie（2026-06-21）
- [x] 刷新 `AGENT_CONTEXT.md` 与 `AGENT_WORKFLOW.md` 当前阶段重点（2026-06-21）
- [x] 新增 `doc/README.md` 文档索引（2026-06-21）
- [x] 新增 Docker 部署方案：`Dockerfile`、`docker-compose.yml`、`.dockerignore`、`doc/docker-deployment.md`（2026-06-21）
- [x] 修复 Docker 镜像缺失 `content/`、`games/` 目录导致 500 的问题；`data/` 与 `content/contact-messages/` 改为宿主机卷持久化（2026-06-21）
- [x] 修复 Cookie 同意横幅在嵌入页（iframe）重复弹出的问题：将 `CookieConsent` 从根布局移到 `(site)` 布局（2026-06-21）
- [x] 增强 GA4 集成：补发 `<Link>` 路由切换的 `page_view`，新增 `trackEvent` 工具，并在点赞、搜索处埋点（2026-06-21）
- [x] 新增 Cloudflare Web Analytics 支持：无 Cookie、无需同意横幅，可与 GA4 同时使用（2026-06-21）
- [x] 搜索体验第一层优化：扩展索引字段至 breakdown/code/demo/article，新增热门搜索建议、搜索结果高亮、无结果推荐（2026-06-21）

---

## 进行中（In Progress）

- P1 体验优化：`<img>` 迁移 `next/image`、联系表单邮件/webhook
- 站点正式上线后的监控与反馈收集

---

## 待办（Todo）

### 上线后优化（P1/P2）

- [ ] 关键路径 `<img>` 迁移到 `next/image`
- [ ] 版主发帖表单：选择原型后自动生成 breakdown / code 骨架
- [ ] AI 分析工具识别并输出 `pattern` 字段
- [ ] 优化联系表单通知（邮件/webhook）

- [ ] `/archetypes/[key]` 与 `/patterns/[key]` 独立详情页

---

## 阻塞与风险

| 阻塞项 | 状态 | 说明 |
|---|---|---|
| 版主鉴权 | ✅ 已修复 | HMAC-SHA256 签名 cookie |
| Lint errors | ✅ 已清零 | 0 errors / 33 warnings |
| 统计持久化 | ✅ 已修复 | Upstash Redis + fallback |
| 图片缺失 | ✅ 已补齐 | 104 张 SVG |
| Git 工作区 | ✅ 已整理 | 8 个功能提交 |
| `<img>` 未优化 | 🟡 P1 | 不影响功能，上线后继续 |
| 生产服务器 Docker 部署 | ✅ 已完成 | `https://ovoforge.com/` 返回 200 |

---

## 健康检查

```bash
pnpm -s typecheck   # ✅ 通过
pnpm -s build       # ✅ 通过
pnpm -s lint        # ✅ 0 errors / 33 warnings
git status --short  # ✅ 工作区干净
```

---

## 部署前需确认

1. 生产环境变量：
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - `NEXT_PUBLIC_CONTACT_EMAIL=your@email.com`
   - `MOD_PASSWORD=<强随机密码>`
   - `UPSTASH_REDIS_REST_URL=<...>`
   - `UPSTASH_REDIS_REST_TOKEN=<...>`
   - `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`（可选）
2. 部署目标：Vercel / VPS / 其他。
3. 若使用 VPS，需单独启动算法后端（`pnpm algo:pm2`）并配置 Nginx 反向代理。
4. 联系表单 Gmail 发送配置（可选）：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REFRESH_TOKEN`。
5. GitHub 仓库 Secrets（用于 `.github/workflows/deploy.yml`）：
   - `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_PATH`
   - `DEPLOY_PORT`（可选，默认 22）

---

## 提交记录

```
693c434 [memory] 更新 P0 上线交付状态、BACKLOG 任务看板与每日笔记
55111c3 [workflow] 新增 Agent 自动任务推进脚本 pnpm agent:next/agent:dry
f9ca732 [auth] 版主鉴权改用 HMAC-SHA256 签名 cookie，禁止伪造 cookie
b9addaa [fix] 修复 block-editor commit 提前访问 bug 并治理 ESLint errors
8e7d9c8 [stats] view/like 统计迁移到 Upstash Redis，新增 API 频率限制
16a4cb6 [content] 建立母型↔核心原型映射并在详情页展示
82b0d86 [assets] 程序化生成母型/原型/特征说明图 104 张
0775479 [perf] 移除外部 CDN 字体依赖，更新 eslint 忽略规则
```
