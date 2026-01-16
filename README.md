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
- `coverWide`：可选横向封面（`src`/`alt`），用于详情页头图；未提供时会回退使用 `cover`
- `Play`：在 `PlayMeta` 基础上可选包含 `articleMdx`

## 封面尺寸与适配（制作建议）

封面最终显示像素会随布局变化，但展示区域有固定比例（更适合按比例来做图）。

### 信息流封面（`cover`）

- 展示比例：
  - 视口 `<420px`：`4:3`
  - 视口 `≥420px`：`3:4`
- 推荐源尺寸（3:4）：`1080×1440`（或 `1200×1600`）
- ComfyUI/SD 出图（推荐，`64` 倍数，3:4）：`960×1280`
- 渲染方式：前景 `object-contain`（不裁切）+ 背景模糊填充（比例不一致会留边/补边）

### 详情页头图（`coverWide`，可选）

- 展示比例：`4:3`，并限制最大高度 `420px`
- 推荐源尺寸（4:3）：`1600×1200`（最低 `1200×900`）
- ComfyUI/SD 出图（推荐，`64` 倍数，4:3）：`1280×960`
- 渲染方式同上：前景 `object-contain` + 背景模糊填充

### ComfyUI 工作流（可选）

- 生成竖版 `960×1280` + 横版 `1280×960`：`comfyui/workflows/minigame_concepts_3x4_and_4x3.json`
- 如颜色总偏同一色系：去掉提示词里的 `pastel/soft gradients`，并补充 `diverse color palette, varied dominant hue` 或直接写明 `color palette: ...`

### 把生成图用于帖子

- 图片放置目录：`public/plays/<slug>/`
- 建议命名（与站内发布逻辑一致）：
  - 竖版封面（信息流）：`public/plays/<slug>/cover.webp`（或 `cover.png/jpg`）
  - 横版封面（详情头图）：`public/plays/<slug>/cover-wide.webp`（或 `cover-wide.png/jpg`）
- 对应字段：在 `content/plays/<slug>/meta.json` 里填写 `cover.src` / `coverWide.src`（例如：`/plays/<slug>/cover.webp`）

### 典型显示尺寸（约，CSS 像素）

- 信息流卡片封面：
  - 375px 宽手机：约 `343×257`（4:3）
  - 768px 平板：约 `360×480`（3:4）
  - 1024px 桌面：约 `300×400`（3:4，含右侧栏布局）
  - 1280px 桌面：约 `364×485`（3:4）
  - 2xl 大屏三列：约 `237×316`（3:4）
- 详情页头图：常见宽度约 `616~991`，高度固定在 `420` 附近（4:3 区域内自适应）

## 目录结构（核心）

- `content/plays/<slug>/meta.json`：玩法元信息（结构化字段）
- `content/plays/<slug>/article.mdx`：玩法文章（当前仅展示原文）
- `src/app/*`：页面路由与 API 路由
- `src/components/plays/*`：卡片、标签、代码块、右侧栏等 UI
- `src/components/site/*`：站点框架（TopNav/BottomNav/MenuDrawer/响应式导航）
- `src/lib/content/plays.ts`：本地内容读取（fs）与类型定义
- `src/lib/mod/auth.ts`：版主 cookie 判定
- `server/*`：玩法算法后端（Fastify，提供示例算法接口）

## 本地开发

```bash
pnpm dev
```

打开 `http://localhost:3000`。

设置版主口令（可选，用于本地发布）：

```bash
export MOD_PASSWORD="your-password"
```

或在项目根目录创建 `.env.local`：

```bash
MOD_PASSWORD=your-password
```

注：当前默认使用 `--webpack` 运行/构建以避免受限环境下 Turbopack 的问题。

## Roadmap（建议下一步）

- 接入 MDX 渲染（而不是展示原文）与更顺滑的编辑流程
- 首页：搜索/分类筛选已可用（`?q=` / `?cat=`），下一步补充更完整的排序/组合筛选/高亮体验
- 互动：浏览/喜欢统计的真实埋点与持久化（目前是内容字段）
- Demo：iframe 白名单、安全策略与尺寸/加载体验优化

## 玩法算法后端（Demo 用）

- 位置：`server`（Fastify + Zod）。提供基础算法示例：网格 BFS 寻路、三消消除校验、伪随机高度图。
- 运行（需要先 `pnpm install` 安装依赖）：
  ```bash
  pnpm algo:dev          # 默认监听 0.0.0.0:4000，可用 ALGO_PORT / ALGO_HOST 覆盖
  ```
- 主要路由：
  - `GET /health`：存活检查
  - `GET /api/algos`：算法列表，返回名称/说明/输入示例
  - `GET /api/algos/:id`：单个算法元信息
  - `POST /api/algos/:id/run`：运行算法，body 为 JSON，返回 `{ output, durationMs }`
- 本地跨域已开启（`@fastify/cors`），可在 Demo 页直接调用。正式环境请按需收紧 CORS 与鉴权。可以在玩法 `meta.demo` 中挂接 `/api/algos/<id>` 作为示例数据来源。

## 玩法算法后端部署（服务器）

- 依赖：Node 18+、pnpm、pm2（`pnpm add -g pm2`）。需要 `pnpm install --prod`（已包含运行所需的 `tsx`）。
- 环境变量：
  - `ALGO_PORT`（默认 4000）
  - `ALGO_HOST`（默认 `0.0.0.0`）
- 一次性安装：
  ```bash
  pnpm install --prod
  ```
- 启动（pm2）：
  ```bash
  pnpm algo:pm2
  pm2 logs ovokit-algo-api   # 查看日志
  pm2 stop ovokit-algo-api   # 停止
  ```
- 进程配置：`ecosystem.algo.config.js` 使用 `pnpm algo:dev` 启动 `server/index.ts`。需要长期运行可用 `pm2 save && pm2 startup` 写入系统服务。
- 反向代理（示例 Nginx）：
  ```
  location /algo-api/ {
    proxy_pass http://127.0.0.1:4000/;
    proxy_set_header Host $host;
  }
  ```
  前端即可通过 `https://your-domain/algo-api/api/algos/:id/run` 调用。生产务必收紧 CORS/鉴权与限流。
