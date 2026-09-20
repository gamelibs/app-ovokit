# GamesLog 项目状态（原 OVOFORGE）

> 最后更新：2026-09-20
> 更新者：Kimi Code CLI

---

## 当前阶段

**支柱内容分类重构 + 内容修复批次（2026-09-20）**：对齐 ovo_system taxonomy.v1.json 的 4 处硬冲突全部落地——features 收敛为 8 词（click/idle/grid/levels/numbers/merge-mechanic/roguelike/timed），generation/state-machine 迁出新分区 `/implementation-traits`（列表+详情+版主编辑+API 全镜像），placement 主映射改 spatial，14 母型 features[] 收敛 taxonomy 兼容特征（placement 改名建造布局/Placement / Building），9 特征 concept 扩写 ≥120 字 + 5 模式追加 ≥130 字，3 组 301 重定向（zh+en）+ sitemap 双语条目，archetype 页特征 chips 链接化（featureKeyByName）。timed 配图 4 张 480×360 走 sketch-svg 管线（仅生成 timed，不重生成其它）。验证：typecheck 0 错、build 成功、PM2 `ovo-site-becf127c` :19600 Playwright 36 项全 PASS + console 零错误、截图 /tmp/pillar-restructure-*.png。**未提交 git**。详见 `memory/daily/2026-09-20.md`。

**多语言 M1 落地（2026-09-16）**：next-intl v4 接入完成，zh-CN 默认无前缀 + en `/en` 前缀（`localeDetection:false` 不强跳）。`(site)` 组整体迁入 `src/app/[locale]/(site)/`，`(site)/api/*` 上移到 `src/app/api/`（URL 不变）；**多 root layout**：删除根 `app/layout.tsx`，`[locale]/layout.tsx`（SSR html lang 正确 + NextIntlClientProvider + 默认 hreflang）与 `(embed)/layout.tsx`（固定 zh-CN）分立，embed/api 完全不进 locale 段。内容层 `plays.ts` 按 locale 读 `content/plays{,-en}`，en 缺稿回退中文并标 `untranslated`（页面显示「本帖暂未翻译」）。UI 串入 `messages/{zh-CN,en}.json`（导航/抽屉/页脚/首页/文章页/收藏/Cookie/搜索建议），站点组件全部换 `@/i18n/navigation` Link；顶部新增「中 / EN」切换器（保路径+query 换 locale）。SEO：play/母型/原型/特征页 hreflang 互链 + locale 感知 canonical，sitemap 双语条目。验证：typecheck/build 通过，Playwright 27/27 + console 零错误，404 三路径均为手绘页。截图 /tmp/i18n-*.png。**未提交 git；生产 :19600 仍跑旧构建，需 build+重启才生效**。遗留 M2：母型/原型/特征页正文 spec 与分类 Tab 标签仍中文、about/privacy/terms/contact 正文中文、这些页 hreflang 暂为根默认、en 难度筛选无效。详见 `memory/daily/2026-09-16.md`。

**Quantum Grid 3D demo 全链路跑通（2026-09-11）**：文章 `tic-tac-toe-3d-rotation-juice` 的 demo 从 2D 替身替换为真实游戏源（astrocade `3d-rotating-tic-tac-toe`）的 3D 重建版，全程走 ovo_system 工作流（远程分析 job_1789120754118_rvx9w0 → 用户确认审查 → create-project **cp_1789130311150**（threejs）→ 主循环 e2e → Demo 反推导出 → 站点文章页内嵌可玩验证）。为此 v2 补齐 3D 能力：新增 `core/board-3d` 模块（Three.js，契约对齐 board-turn）、preview 多运行时库加载、适配器 3D 变体 + frameworks 信号识别 + 修 2D 旧项目共有的 backToMenu 迁移缺陷。旧 2D 项目 cp_1788757022723 保留对照。草稿 channelMeta.source 已补齐溯源。**坑：standalone 产物下 public 变更需 rsync 进 `.next/standalone/public` 再 pm2 restart**。三仓库（ovo_system / ovo_workspace / gameslog-site）均有待提交改动，等用户确认。详见 `memory/daily/2026-09-11.md`。

**存量审查 UI 化 + 指南机检化（D 层）+ 四批修复（2026-09-09）**：存量审查搬进 ovo_system「内容生产」页第五个 Tab（`auditInventory` 适配器能力 + 3 条 API + 报告落库，baseUrl 自动解析）。同日审查器加 **D 指南结构层**（《生产内容注意事项》§四/§七 机检：9 标准章节/正文代码块/重复凑字/demo 存在），全量基线 **377 问题**。已修复四批：① 30 篇 subtitle 本机 omlx 9B 重写至 50~160 字；② 9 篇无归属文章补显式 `meta.archetype` + 母型页补齐 pillar→cluster「相关案例文章」区块；③ 批 2 指南结构补全 32/32——`fix-batch-2-guide-sections.ts` 给每篇补「一句话本质/边界条件/设计取舍」（LLM 只生成正文、插入程序化、反引号标识符防编造护栏、每篇 2 次重试；CRLF 行尾坑已修）；④ **批 5 英文回刷 32/32**——`fix-batch-5-translate-en.ts`（omlx 9B，meta JSON + 第 3 次纯文本分节兜底），en-coverage 清零。**现基线 314 问题**（09-10 新增 3 条机检后 255→320，tic-tac-toe-3d 精修清掉 6 项）：D 层 240（experience/mechanics×32、implementation×31、code×30、loop/data-model/primitives×30、demo×24）+ A/C 余 15（demo-404×6、demo-localhost×2、pillar-empty×5、body×1）+ EN 质量 64（en-meta-cjk×32、en-description-length×32，09-10 新机检）。同日主页「最新发布」同母型去重（含 tag 推断兜底，cover-gen 按母型复用模板是根因）、RightSidebar 新手必读改真封面 + 入门选品、play-1677a241 meta 清洗与未闭合代码栅栏修复。备份 `memory/audit-fix-backups/2026-09-09/`。**重要缺口：英文内容已备齐但站点不可见——`src/` 零引用 plays-en，无英文路由；下一里程碑=英文路由 + UI chrome 英文化 + hreflang（EN subtitle 偏长，上线时统一修剪）。** 详见 `memory/daily/2026-09-09.md`。

**SEO 基础修复完成（2026-09-08）**：双 H1（MDX 标题降级）+ 5 处 OVO 硬编码收编 siteConfig，:19600 生产实例验证通过；hreflang 暂缓（无英文路由，并入英文化任务）。改动已 build 生效于本地生产实例，**未提交、未 release**（demo iframe localhost 阻塞仍在）。详见 `memory/daily/2026-09-08.md`。

**生产线全链路首跑通（2026-09-07 晚）**：ovo_system「远程游戏库 → 20B 分析 → v2-studio 建项目 → 管线双语文章 → 发布 → 本站嵌入可玩 demo」首次真实贯通。文章 `tic-tac-toe-3d-rotation-juice`（zh + en）已物化到 content/plays{,-en}，生产实例验证六项断言全过、demo 竖屏可玩。**工作区当前有未提交改动**：`page.tsx` 竖屏判定（`/api/v2/projects/` → portrait）+ 该文章双语言内容目录——demo iframe 指向 localhost:19527，**禁止带上线**；待静态 demo 导出立项后再发布此类文章。详见 `memory/daily/2026-09-07.md`。

**cluster→pillar 回链落地 + 母型补齐 14/14（2026-09-07）**：play 详情页删除硬编码 tag 启发式，收编为 `src/lib/archetypes/tag-map.ts`（site-tags.v1.json 站点侧拷贝，同步口径已注明）；新增「玩法行为」区块（母型名 + `/archetypes/[key]` 可见回链，Sketch 风格令牌）。`playArchetypeKeys`/`archetypeToPatterns` 补齐 merge-unit（→merge）与 turn-duel（→strategy），两篇 meta.json 以 taxonomy.v1.json 为唯一内容依据；配图复用 cover-gen 蚀刻报纸风管线；原子 demo 无需注册（`public/demos/atomic/` 已有）。sitemap 自动含新条目。已知影响：11/31 篇 play 的母型推断变化（feature 级 tag 不再推断母型，如 合成/数值/放置；塔防 resolve→placement）；「回合博弈」tag 未入映射表，tic-tac-toe-showdown 暂无回链（需 ovo_system 侧补映射）。main（f3bae4d）→ 产物 deploy/gameslog.top（cf637fc）。

**内容生产线落地 + 仓库目录改名（2026-09-06 第四轮）**：仓库目录 `app-ovoforge-site` → `gameslog-site`（PM2 cwd、站点注册表 repoPath 已同步，:19600 正常）。ovo_system 侧内容生产线引擎（8 插件 + gameslog-mdx 适配器 + 17 条 `/api/content-pipeline/*`）与 admin-web「内容生产」页上线；全链路验收（选题→草稿→门禁→发布→构建→下线清理）通过，门禁 fail 409 阻断、forge-studio 离线 503 诚实返回。事实修正：taxonomy 实为 **14 母型**，本站仅 12 个母型页，缺 merge-unit / turn-duel。

**内容生产线设计已存档（2026-09-06 第三轮）**：确认双层内容模型（12 母型 pillar 框架层 + 个体游戏案例 cluster 实例流、案例回链母型）与「生产端在 ovo_system、站点只渲染、契约=ContentPack」边界；管线为四层插件（选题源/生成器/质量门禁/渠道适配器）+ 渠道 profile，gameslog 仅为首个渠道、引擎站点无关。权威文档：ovo_system `docs/site-content-production-line.md`；本站存档：`doc/站点内容生产线说明.md`。待核实：/archetypes 深度、meta.json 字段、taxonomy 结构。目录改名 app-ovoforge-site → gameslog-site 影响已评估，待确认执行。

**ovoforge → gameslog 命名空间全量迁移 + deploy.sh 防呆加固（2026-09-06 第二轮）**：PM2 进程名 gameslog-web / gameslog-algo-api、包名 app-gameslog、docker-compose 服务/容器/镜像/网络名全改；localStorage / cookie（gameslog_mod）/ Redis 前缀（gameslog:stats）/ CSS 变量 / 自定义事件全部改 gameslog（TopNav 保留 ovoforge_mod_tools 旧键迁移；platform-import.ts 注释保留 ovo_system 侧真实 profile 名 ovoforge-v1）。deploy.sh 新增防呆：同名 PM2 进程 cwd 校验（guard_same_name_app，防止误 reload 其它部署残留的旧进程）+ pm2 start 前期望端口占用拒绝启动。main（baf2093）与 deploy/gameslog.top（ac8686f）已推送并核实两端一致；产物独立验证三项 200。本决策覆盖 2026-09-02「技术命名空间保持不变」的旧决策（见下段）。

**产物平台无关化完成并已推送（2026-09-06）**：`next.config.ts` 加 `images: { unoptimized: true }`（图片全是预生成 webp，运行时优化纯冗余）；`scripts/release.sh` 新增 sharp 剔除步骤（node_modules 72M→38M，产物 104M→70M，零 `.node` 原生二进制，Ubuntu 直接可跑）。main（6225164）与 deploy/gameslog.top（efe1327）已推送 GitHub（SSH 443 端点），两端哈希一致。产物独立验证通过：HTML 零 `/_next/image`、封面直链 200。

**产物型部署分支就绪（2026-09-05 下午，取代上午的源码型方案）**：`deploy/gameslog.top` 为 **orphan 纯产物分支**（Next.js standalone + 服务器侧 deploy.sh/ecosystem.config.js/.env.example，无源码历史）。Mac 侧用 `pnpm release`（`scripts/release.sh`）构建并发布产物提交；服务器侧 `bash deploy.sh deploy` 免构建更新。源码型 `scripts/deploy.sh` 已删除（deploy-check.sh 与 ecosystem.web.config.js 保留作参考）。注意：next.config.ts 已开 `output: 'standalone'`，本地 `pnpm build` 产物结构随之变化（`.next/standalone/`）。

**域名切换为 gameslog.top，品牌收编为 GamesLog（2026-09-02）**：ovoforge.com 已转给其它站点使用。仓库已完成品牌中性化（siteConfig 单一来源 + 2 处硬编码收编），技术命名空间（storage key/cookie/Redis 前缀等）保持不变。站点尚未部署到 gameslog.top，下一步走 ovo_system 模拟上线流程（合规审查 → 上线清单 → 部署 → 线上复审）。

**上线审查 3 个 failed 节点已修复（2026-09-03）**：SEO 元信息（description/keywords/canonical）补齐、站点经 ovo_system 从 dev 模式切换为**生产构建模式**（`pnpm build` + `npm run start`，传输 3.32MB→0.42MB）、移动端触控目标全部 ≥44px。模拟审查总分 81→88（passed=true），剩余 failed 为 AdSense 接入（f-ads-txt/f-adsense-script）与 d-responsive 检查器采样口径问题（站点 CSS 实际含 @media，详见 `memory/daily/2026-09-03.md`）。注意：站点现为生产模式，代码改动需重新 build 后重启生效。

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

## 本轮更新（2026-06-23）

- 清理全站面向终端用户的内部占位/提示文案：删除 24 个玩法 `demo.note` 中的"建议 Demo"与"MVP 占位"文本、详情页文章区"不支持自定义组件"说明、7 处技术栈 `(占位)` 标记、`PlayMiniDemo` 中的开发者提示；`readPlayMeta` 增加 `demo` 字段缺失兜底。
- 验证：`pnpm typecheck` 通过、`pnpm lint` 0 errors / 30 warnings、`pnpm test:smoke` 68/68 通过。

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
- [x] 核心图片迁移到 next/image，LCP/CLS 优化（2026-06-21）
- [x] 联系表单增加通用 Webhook 实时通知（2026-06-21）
- [x] 母型/核心原型/玩法特征独立详情页上线，SEO 结构完整（2026-06-21）

---

## 进行中（In Progress）

- P1 体验优化：联系表单邮件/webhook 已补充 webhook 通道；`<img>` 已迁移核心路径
- 站点正式上线后的监控与反馈收集
- UI 边框调优与移动端详情页结构优化（待用户确认后提交部署）
- H5 Demo 体系重构：规范已输出，待外部工具创作实现

---

## 待办（Todo）

### 上线后优化（P1/P2）

- [ ] 关键路径 `<img>` 迁移到 `next/image`
- [ ] 版主发帖表单：选择原型后自动生成 breakdown / code 骨架
- [ ] AI 分析工具识别并输出 `pattern` 字段
- [ ] 优化联系表单通知（邮件/webhook）
- [ ] 移动端玩法详情页结构优化：首屏后直达 Demo，隐藏移动端封面占位

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
| 移动端详情页封面占位 | 🟡 P1 | 已改待部署 |
| 生产服务器 Docker 部署 | ✅ 已完成 | `https://ovoforge.com/` 返回 200 |

---

## 健康检查

```bash
pnpm -s typecheck   # ✅ 通过
pnpm -s build       # ✅ 通过
pnpm -s lint        # ✅ 0 errors / 30 warnings
git status --short  # ⚠️ 含本轮内容清理改动，待提交
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
2439e4b [content] ContentPack v1.1 站点配合：play meta 支持显式 archetype 字段，回链优先读显式值
（deploy/gameslog.top：1bd787c 产物：main 2439e4b；两端已推送并核实一致）
a2ca3f0 [memory] 追加 site-tags v1.0.1 同步记录
a9a5fa7 [archetypes] 同步 site-tags v1.0.1：新增「回合博弈」tag → turn-duel 映射
（deploy/gameslog.top：1526247 产物：main a9a5fa7；两端已推送并核实一致）
2beaf15 [memory] STATUS 提交记录补登 2026-09-07 哈希
4afd7b9 [memory] 记录 cluster→pillar 回链与 14 母型补齐（2026-09-07）
f3bae4d [archetypes] 补齐 merge-unit/turn-duel 母型页并落地 cluster→pillar 回链
（deploy/gameslog.top：cf637fc 产物：main f3bae4d；main 4afd7b9 / deploy cf637fc 已推送并核实两端一致）
693c434 [memory] 更新 P0 上线交付状态、BACKLOG 任务看板与每日笔记
55111c3 [workflow] 新增 Agent 自动任务推进脚本 pnpm agent:next/agent:dry
f9ca732 [auth] 版主鉴权改用 HMAC-SHA256 签名 cookie，禁止伪造 cookie
b9addaa [fix] 修复 block-editor commit 提前访问 bug 并治理 ESLint errors
8e7d9c8 [stats] view/like 统计迁移到 Upstash Redis，新增 API 频率限制
16a4cb6 [content] 建立母型↔核心原型映射并在详情页展示
82b0d86 [assets] 程序化生成母型/原型/特征说明图 104 张
0775479 [perf] 移除外部 CDN 字体依赖，更新 eslint 忽略规则
```

**部署运行说明沉淀（2026-09-17）**：`doc/deploy-运行说明.md` 上线——deploy.sh 用法/子命令/「无法启动」五类报错对照表/分支防呆（服务器必须检出 deploy 分支）/CF 缓存/GH Actions 当前断点（SSH step failure，DEPLOY_HOST 疑指向 CF 边缘地址）。手动部署路径：`bash deploy.sh deploy`（产物分支模式）。
