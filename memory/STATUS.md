# OVOFROGE 项目状态

> 最后更新：2026-06-21
> 更新者：Kimi Code CLI

---

## 当前阶段

内部 MVP 运行阶段。站点已可本地运行，重点从"上线投产"转向"扩展分类体系 + 版主工作流可用"。

## 当前目标

把站点从"12 种母型玩法目录"扩展为 **"12 母型 + 5 种核心编辑器原型"的双层分类体系**。

详见 `memory/GOALS.md`。

---

## 已完成（Done）

- [x] 前端信息架构：首页、详情页、母型列表页、版主后台、嵌入页
- [x] 手绘风格系统：颜色令牌、字体、Sketch 组件
- [x] 30 篇玩法内容（meta.json + article.mdx）
- [x] 12 种母型玩法文案
- [x] 三消 Demo（match3）可玩
- [x] 12 个母型最小 Demo（通用 archetype viewer）
- [x] 浏览/喜欢统计（基于 `data/plays-views.json`）
- [x] 版主登录、发帖、编辑、发布/下架、删除
- [x] AI 分析/封面/流程图/示意图工具（需 `MOONSHOT_API_KEY`）
- [x] sitemap / robots
- [x] 联系表单（本地落盘到 `content/contact-messages/`）
- [x] `pnpm typecheck` 通过
- [x] `pnpm build` 通过
- [x] **迭代 1：5 种核心玩法原型数据层 + 首页筛选 + 版主表单**（含修复 `isPlayBrowseGroupKey`）
- [x] **迭代 3：5 种核心原型最小 Demo + 嵌入页面 + 详情页回退逻辑**（含根据 tags 自动推断 pattern 的兼容逻辑、ServerDemoPlayer 自适应布局与交互优化）
- [x] **迭代 4：核心原型内容文件化 + 版主母型管理后台**
  - 5 种核心玩法原型描述数据迁移到 `content/patterns/<key>/meta.json`，提供 `src/lib/patterns/spec.ts` 读取器
  - 版主后台新增 `/mod/archetypes` 列表页、`/mod/archetypes/[key]/edit` 编辑页、保存 API `/api/mod/archetypes/[key]`
  - 母型图片上传 API `/api/mod/archetypes/[key]/images`（保存到 `public/archetypes/<key>/`，支持 png/jpg/webp/gif/svg，最大 4MB）
- [x] **迭代 5：核心玩法管理后台与内容补齐**
  - 扩展 `CorePatternMeta` schema，新增 `concept`/`role`/`significance`/`problemsSolved`/`learningGoals`/`minimalRules`/`systemLoopHint`/`combos`/`advancedWarnings`/`advancedAlgoRefs`
  - 为 5 种核心玩法生成详细 `content/patterns/<key>/meta.json`
  - 版主后台新增 `/mod/patterns` 列表页、`/mod/patterns/[key]/edit` 编辑页、保存 API `/api/mod/patterns/[key]`
  - 核心玩法图片上传 API `/api/mod/patterns/[key]/images`（保存到 `public/patterns/<key>/`）
- [x] **迭代 6：核心玩法预览页与首页入口**
  - 新增 `/patterns` 与 `/patterns/[key]` 预览页面，展示概念/作用/意义、系统拆解、Demo、组合与高级设计
  - 顶部浏览分组「核心原型」现在指向 `/patterns`
  - 首页新增「核心玩法原型」快捷入口
- [x] **迭代 7：玩法特征内容与管理机制**
  - 9 个玩法特征（merge/idle/click/grid/levels/numbers/generation/roguelike/state-machine）迁移到 `content/features/<key>/meta.json`
  - 每个特征包含概念/作用/意义、筛选标签、经典案例、学习目标、最小规则、组合、设计警告、算法参考
  - 版主后台新增 `/mod/features` 列表页、`/mod/features/[key]/edit` 编辑页、保存 API、图片上传 API
  - 新增 `/features` 预览页与 `/features/[key]` 重定向，顶部「玩法特征」分组指向 `/features`
  - 首页新增「玩法特征」快捷入口
- [x] **首页 Hero 价值主张与品牌更名**
  - Hero 标题改为「学习游戏玩法设计与实现」
  - 新增价值点列表：拆解经典游戏机制 / 理解核心规则循环 / 试玩最小 Demo / 学习技术实现
  - 新增统计数字：200+ 玩法案例 / 50+ 可试玩 Demo / 100+ 技术要点
  - 全站品牌名从 `OVOKIT` 改为 `OVOFROGE`（包括代码变量、cookie、localStorage key、文档、配置文件）
- [x] **核心玩法命名优化**
  - `action`：动作敏捷 → 动作反应 (Action)
  - `spatial`：空间布局 → 空间规划 (Spatial)
  - `strategy`：数值策略 → 策略成长 (Strategy)
- [x] **核心玩法流程图 SVG**
  - 为 5 种核心玩法绘制手绘风格流程图：`public/patterns/<key>/loop.svg`
  - 流程图使用统一尺寸 800×300，展示核心循环节点与关键设计点
  - `/patterns` 预览页在「系统拆解」顶部展示流程图
- [x] **图片上传自动压缩**
  - 安装 `sharp`，新增 `src/lib/mod/image-upload.ts` 统一处理上传
  - png/jpg/webp 自动等比压缩，最长边不超过 1200px
  - jpg/jpeg 使用 85% 质量，png 使用最高压缩级别
  - 上传组件提示文字同步更新
- [x] **玩法帖子封面 SVG 批量生成与展示优化**
  - 新增 `scripts/generate-play-covers.ts`，支持程序化（RoughJS）与 AI（Kimi `/api/ai/generate-cover`）两种模式
  - 为 30 个玩法帖子统一生成 **436×310**（4:3 横版）的 `cover.svg` 与 `cover-wide.svg`，并更新 `meta.json`
  - 缺失目录的帖子自动创建目录；程序化模式根据 slug 精确映射到最相关的手绘图形
  - 扩展 `src/lib/sketch-svg/generator.ts`：新增 `grid`（网格）、`dice`（骰子）、`clock`（时钟）、`tap`（点击）四种游戏主题图形；优化 `flow-process` / `flow-decision` 的空心外框设计，避免小尺寸糊掉
  - 调整卡片/详情页/相关推荐/列表项的封面展示：统一 4:3 比例、`object-contain` 完整显示、详情页封面缩小为侧边/移动端小横幅，避免抢夺内容焦点
- [x] **首页「热门玩法」管理**
  - 新增 `热门` 标签到 `availablePlayTags`
  - `HotPlaysSection` 改为按 `热门` 标签筛选，最多展示 5 个帖子
  - 为 5 个主题各异的帖子添加 `热门` 标签：三消、合成、塔防、点击躲避、状态机
- [x] **标题完整显示**
  - 移除 `HotPlaysSection`、`PlayListItem`、`RelatedPlays` 中标题的 `line-clamp-1`，让帖子标题完整换行显示，不再用 "..." 截断
- [x] **发现页与移动端布局**
  - 顶部导航「发现」按钮链接改为 `/?all=1&group=difficulty`，点击后直接进入难度层级浏览界面
  - 玩法列表 masonry 布局改为 `grid grid-cols-2`，保证移动端也是两列显示且卡片等宽；`2xl` 屏幕以上三列
  - 移动端 `PlayCard` 紧凑化：
    - 封面限制 `max-h-[100px]`，padding 缩小
    - 收藏按钮移到封面右下角，仅显示小星星图标（新增 `iconOnly` 模式）
    - 标签最多 2 个、`size="sm"`、单行不换行
    - 标题/副标题移动端单行，大屏恢复多行
    - 技术栈/核心点仅在桌面端显示
    - 按钮高度降至 `h-8`
  - 移动端一屏可显示 2×2 共 4 张卡片，屏幕更高时自然显示更多行
- [x] **首页与关于页文案调整**
  - Hero 标题改为「探索游戏玩法，发现设计乐趣」，副标题明确面向「所有游戏爱好者」
  - 删除首页具体数字统计（200+ 案例 / 50+ Demo / 100+ 要点）
  - 价值点强调「拆解机制、理解规则循环、试玩 Demo、学习实现、分享想法」
  - 关于页与全站 metadata 同步改为爱好者向定位
- [x] **代码块支持折叠**
  - `CodeBlock` 组件改为 Client Component，默认完全折叠，不显示代码内容
  - 标题栏显示语言、行数，右上角提供「查看代码」按钮
  - 点击后展开显示完整代码，按钮变为「收起」

---

## 进行中（In Progress）

- [ ] **母型与核心原型的映射 + 母型详情页展示**（迭代 2）
  - 文件：`src/lib/archetypes/archetypes.ts`、`src/features/archetypes/pageModel.ts`、`src/components/archetypes/ArchetypePage.tsx`
  - 负责人：Kimi Code CLI
  - 状态：待开始
- [ ] **母型图片资源填充**
  - 说明：管理后台已就绪，等待用户上传 12 个母型的说明图/封面图到 `public/archetypes/<key>/`
  - 状态：阻塞（等待用户素材）
- [ ] **核心玩法图片资源填充**
  - 说明：管理后台已就绪，等待用户上传 5 种核心玩法的说明图/封面图到 `public/patterns/<key>/`
  - 状态：阻塞（等待用户素材）

---

## 待办（Todo）

- [ ] 版主发帖表单：选择原型后自动生成 breakdown / code 骨架
- [ ] 治理 Lint errors（至少 115 个 errors，尤其是 `useBlockEditor.ts` 的 `commit` 提前访问 bug）
- [ ] 统计持久化：把文件系统 views/likes 迁到 Redis/DB（serverless 环境下会丢数据）

---

## 阻塞与风险

| 阻塞项 | 影响 | 建议处理 |
|---|---|---|
| Lint 115 errors | block-editor 撤销功能有真实 bug | 在不影响当前目标的前提下分批修复 |
| 统计基于文件系统 | 多实例/serverless 会丢数据 | 内部单实例运行无影响，上线前再迁 |

---

## 健康检查

```bash
pnpm -s typecheck   # ✅ 通过（2026-06-21）
pnpm -s build       # ✅ 通过（2026-06-21 封面 SVG 已生成）
pnpm -s lint        # ❌ 115 errors / 1749 warnings（2026-06-20；新增文件无 error）
git status --short  # ✅ 工作区已清理（2026-06-14）
```

---

## 下一次会话应优先处理

1. 上传 12 个母型的图片资源到 `public/archetypes/<key>/`
2. 上传 5 种核心玩法的图片资源到 `public/patterns/<key>/`
3. 上传 9 个玩法特征的图片资源到 `public/features/<key>/`
4. 开始实施 `memory/GOALS.md` 中的迭代 2：母型与核心原型的映射 + 母型详情页展示
5. 或修复 Lint errors 中的 block-editor bug
