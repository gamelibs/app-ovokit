## Agent Context (OVOKIT)

本仓库包含较多内容与资源文件。为减少“重复扫描/重复读文件”带来的上下文流量消耗，请优先遵循下面的阅读顺序与范围约定。

### Agent 工作流入口（新增，必读）

本仓库已建立 Agent 工作流记忆系统，用于跨会话自动接续项目目标与任务状态。

**每次新会话启动时，先读这些文件（按顺序）**：

1. `memory/STATUS.md` —— 项目当前快照、健康检查、阻塞
2. `memory/GOALS.md` —— 当前阶段目标与里程碑
3. `memory/BACKLOG.md` —— 任务看板（In Progress / Todo / Done）
4. `memory/DECISIONS.md` —— 关键架构/产品决策
5. `doc/AGENT_WORKFLOW.md` —— 工作流规范

然后再读下面的默认文档。禁止在没读记忆文件前做全仓库扫描。

**每次工作结束时，必须更新**：

- `memory/STATUS.md`
- `memory/BACKLOG.md`
- `memory/daily/YYYY-MM-DD.md`
- 如果做了重大决策，更新 `memory/DECISIONS.md`

### 先读什么（默认顺序）

1. `doc/AGENT_CONTEXT.md`（给 AI/协作者的最小上下文与忽略目录约定）
2. `README.md`（MVP 目标、路由与本地运行）
3. `doc/开发说明.md`（更完整的目录分层、路由、Demo/算法后端约定）

### 默认不要全仓库扫描的目录（除非任务明确需要）

- `node_modules/`（依赖体积大）
- `public/`、`imgs/`、`games/`、`ReferenceCase/`、`comfyui/`（资源/案例为主）
- `content/`（内容数据可能很大；只在需要具体 slug/key 时读取对应小范围文件）

### 变更原则

- 优先做“最小可验证”改动；避免无关重构与大范围格式化。
- 写新约定/新增文档时，优先放在 `doc/` 并在 `doc/AGENT_CONTEXT.md` 里补充索引。
- 若目录下存在更深层的 `AGENTS.md`，以更深层文件约定为准。

---

## 手绘风格设计系统（强制约定）

> **范围**：所有前端页面（`(site)` 和 `(embed)`）的 UI 改造必须遵守。
> **目标**：产品定位（玩法技术分享站）与页面结构完全不变，仅做视觉风格改造。
> **效果参考**：Notion + Excalidraw + Sketchplanations 的手绘线稿风。

### 一、必须安装的依赖

```bash
pnpm add roughjs lucide-react
```

- `roughjs`：手绘边框/线条渲染
- `lucide-react`：图标库（强制 strokeWidth=2）

### 二、字体加载（唯一真源）

通过 `next/font/google` 加载，入口文件：

```typescript
// src/lib/fonts.ts
import { Inter, Kalam } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
export const kalam = Kalam({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-kalam', display: 'swap' });
```

在 `src/app/layout.tsx` 中：`className={\`${inter.variable} ${kalam.variable}\`}`

**使用规则**：
| 元素 | 必须使用 |
|------|---------|
| H1/H2/H3/卡片标题 | `font-kalam` |
| 正文/段落/代码 | `font-sans`（Inter） |

### 三、颜色令牌（禁止写死）

全局 CSS 变量（`src/app/globals.css`）：

```css
:root {
  --paper-bg: #faf7ef;
  --paper-bg-warm: #f5f1e6;
  --ink: #202020;
  --ink-light: #555555;
  --ink-muted: #888888;
  --highlight-yellow: #ffda6a;
  --highlight-blue: #7dcfff;
  --highlight-red: #ff8b8b;
  --highlight-green: #7dd87d;
}
```

Tailwind 配置已注册：`bg-paper`、`text-ink`、`bg-highlight-yellow` 等。

**禁止**：在任何组件中写死 `#faf7ef`、`#202020` 等字面量。必须从 Tailwind 令牌或 CSS 变量取值。

### 四、强制组件（必须使用）

所有边框、卡片、按钮、分隔线**必须**使用以下组件，禁止手写 `border` / `box-shadow`：

```typescript
// src/components/sketch/SketchBorder.tsx    —— 手绘边框容器
// src/components/sketch/SketchCard.tsx      —— 手绘卡片（含微旋转 -1°~+1°）
// src/components/sketch/SketchButton.tsx    —— 手绘按钮
// src/components/sketch/SketchDivider.tsx   —— 手绘分隔线
// src/components/sketch/SketchIcon.tsx      —— Lucide 图标包装（strokeWidth=2）
```

**组件规范**：
- `<SketchCard>`：旋转角度限制在 `[-1deg, +1deg]`，基于 slug hash 固定（非每次刷新随机）
- `<SketchButton>`：variant 支持 `primary`（黄底）、`secondary`（纸底）、`ghost`（透明）
- `<SketchBorder>`：roughness=2, bowing=1, strokeWidth=2, stroke=#202020
- `<SketchIcon>`：所有图标必须 `strokeWidth={2}`，禁止 3D/彩色/拟物图标

### 五、禁止事项（Lint 级约束）

- ❌ 禁止写死颜色值（如 `#ffffff`、`#000000`）
- ❌ 禁止手写 `border`、`box-shadow`、`background-color` 字面量
- ❌ 禁止直接写 `font-family`
- ❌ 禁止 PNG/JPG/WebP 装饰性素材（封面/图标/分隔线全部 SVG）
- ❌ 禁止卡片旋转超过 ±1deg
- ❌ 禁止 RoughJS roughness > 4

### 六、Dark Mode 策略

**废弃 Dark Mode**。手绘风格在深色下不协调。

移除 `prefers-color-scheme: dark` 媒体查询，全站固定纸张背景。当前已有的 dark 类名和条件渲染需逐步清理或忽略。

### 七、实施原则

1. **结构不变**：路由、页面组件逻辑、数据流、内容模型（`content/*`）完全不动
2. **最小替换**：把现有组件里的 `className` 和样式替换为手绘风格，不重构组件接口
3. **逐步替换**：先改站点壳（TopNav/BottomNav）→ 首页 → 详情页 → 母型玩法页 → 其他页面
4. **SVG 素材后续补充**：先完成 UI 框架，手绘插图/封面 SVG 作为 P2 补充

### 八、参考文档

- 完整设计契约：`doc/手绘风格契约.md`
- 风格说明（对齐后）：`doc/站点风格说明.md`
