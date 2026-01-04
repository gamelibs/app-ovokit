OVOKIT：游戏玩法技术实现分享站（MVP）

目标是把「玩法」拆成可复用的结构化信息（拆解/关键代码/Demo/文章），并提供一个轻量的本地内容发布流程。

## 当前是否“够用”

作为“玩法技术实现分享站”的 MVP，目前前端信息架构已经具备基本形态：

- 首页信息流：卡片流展示玩法（标签、难度、技术栈、核心点、浏览/喜欢计数占位）
- 详情页：结构化拆解 + 关键代码片段 + Demo 区（iframe 占位）+ 文章（MDX 原文占位）
- 响应式导航：移动端底部导航、桌面端顶栏导航、右上角菜单抽屉
- 内容管理（MVP）：口令登录后可在站内创建玩法，写入本地 `content/plays/<slug>`

仍属于 MVP：搜索/筛选、真实“喜欢/浏览”、MDX 渲染、导航入口的实际跳转等都还未完成（见“Roadmap”）。

## 功能一览

- 内容源：本地文件 `content/plays/<slug>/{meta.json,article.mdx}`
- 首页 `/`：分类 Tabs（视觉占位）+ 卡片流 + 桌面右侧栏（热门标签/新手必读）
- 详情 `/play/[slug]`：
  - `breakdown` 结构化拆解展示
  - `codeSnippets` 代码高亮展示（当前为简单代码块组件）
  - `demo.iframeSrc` 存在时渲染 iframe，否则显示占位
  - `article.mdx` 当前不解析，仅展示原文（占位）
- 版主模式（本地发布）：
  - 右上角菜单 -> 输入口令（环境变量 `MOD_PASSWORD`）登录
  - `/mod`：内容管理列表
  - `/mod/new`：表单创建玩法并写入本地文件（支持封面上传）

## 路由与接口

**页面（App Router）**

- `/`：`src/app/page.tsx`
- `/play/[slug]`：`src/app/play/[slug]/page.tsx`
- `/mod`：`src/app/mod/page.tsx`
- `/mod/new`：`src/app/mod/new/page.tsx`

**API（版主发布）**

- `POST /api/mod/login`：校验 `MOD_PASSWORD`，写入 httpOnly cookie
- `POST /api/mod/logout`：清理 cookie
- `GET /api/mod/me`：返回是否版主
- `POST /api/mod/plays`：写入 `content/plays/<slug>/meta.json` 与 `article.mdx`

## 内容模型

玩法的结构定义在 `src/lib/content/plays.ts`：

- `PlayMeta`：首页与详情展示用的结构化字段（`tags`/`difficulty`/`techStack`/`corePoints`/`breakdown`/`codeSnippets`/`demo` 等）
- `cover`：可选封面（`src`/`alt`），发布时会写入 `public/plays/<slug>/cover.*`
- `Play`：在 `PlayMeta` 基础上可选包含 `articleMdx`

## 目录结构（核心）

- `content/plays/<slug>/meta.json`：玩法元信息（结构化字段）
- `content/plays/<slug>/article.mdx`：玩法文章（当前仅展示原文）
- `src/app/*`：页面路由与 API 路由
- `src/components/plays/*`：卡片、标签、代码块、右侧栏等 UI
- `src/components/site/*`：站点框架（TopNav/BottomNav/MenuDrawer/响应式导航）
- `src/lib/content/plays.ts`：本地内容读取（fs）与类型定义
- `src/lib/mod/auth.ts`：版主 cookie 判定

## 本地开发

```bash
pnpm dev
```

打开 `http://localhost:3000`。

设置版主口令（可选，用于本地发布）：

```bash
export MOD_PASSWORD="your-password"
```

注：当前默认使用 `--webpack` 运行/构建以避免受限环境下 Turbopack 的问题。

## Roadmap（建议下一步）

- 接入 MDX 渲染（而不是展示原文）与更顺滑的编辑流程
- 首页：搜索/分类筛选已可用（`?q=` / `?cat=`），下一步补充更完整的排序/组合筛选/高亮体验
- 互动：浏览/喜欢统计的真实埋点与持久化（目前是内容字段）
- Demo：iframe 白名单、安全策略与尺寸/加载体验优化
