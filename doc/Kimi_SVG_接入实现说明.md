# Kimi SVG 绘制接入实现说明

> 本文档说明 OVOFROGE 站点如何通过 Kimi（Moonshot）大模型能力，根据游戏截图/源码生成 SVG 图片（封面、界面示意图、流程图等），以及本地手绘 SVG 素材的生成机制。

---

## 一、总体架构

当前实现包含两条互补的 SVG 生产能力：

| 能力 | 驱动方式 | 输出 | 典型使用场景 |
|------|---------|------|-------------|
| **AI 生成 SVG** | Kimi Code API（视觉+文本多模态） | 完整 SVG 字符串 | 根据游戏截图生成封面、界面线框图 |
| **本地程序化 SVG** | RoughJS（手写风格几何渲染） | 手绘风格 SVG 字符串 | 生成固定图标、装饰元素、预设封面模板 |

两者都遵循站点“手绘线稿风”设计系统（`doc/手绘风格契约.md`），最终 SVG 可被复制、下载或导出为 PNG/JPG/WebP。

---

## 二、Kimi API 接入层

### 2.1 环境变量

在 `.env.local` 中配置：

```bash
MOONSHOT_API_KEY=your_kimi_api_key
```

### 2.2 客户端封装

核心文件：`src/lib/ai/moonshot.ts`

- **接入协议**：Kimi Code API 的 Anthropic-compatible Messages API
  - Endpoint：`https://api.kimi.com/coding/v1/messages`
  - 鉴权头：`x-api-key: <MOONSHOT_API_KEY>`、`anthropic-version: 2023-06-01`
- **默认模型**：`kimi-k2-6`
- **核心函数**：
  - `chat(options)`：非流式对话，用于所有 SVG/分析生成
  - `chatStream(options)`：流式对话，当前站点暂未使用，但已预留
- **消息格式**：支持文本块 `text` 和 base64 图片块 `image` 的多模态消息

```typescript
// 示例：构造一条带截图的多模态消息
{
  role: "user",
  content: [
    { type: "text", text: "请根据这张游戏截图生成 SVG 封面" },
    { type: "image", source: { type: "base64", media_type: "image/png", data: "..." } }
  ]
}
```

### 2.3 通用工具函数

文件：`src/lib/ai/analyze-utils.ts`

| 函数 | 作用 |
|------|------|
| `makeImageBlock(base64, mimeType)` | 把前端上传的图片转成 Kimi 可识别的 image block |
| `parseJsonFromResponse(raw)` | 兼容解析模型返回的 JSON（含 markdown 代码块、前后缀噪声等） |
| `readSourceCode(dir)` | 读取游戏源码目录，用于流程图/全面分析 |

---

## 三、AI 生成 SVG 的 API 路由

所有 AI 生成功能都放在 `src/app/(site)/api/ai/*`，统一受版主权限校验保护（读取 `MOD_COOKIE`）。

### 3.1 生成 SVG 封面：`/api/ai/generate-cover`

文件：`src/app/(site)/api/ai/generate-cover/route.ts`

**输入**：

```json
{
  "imageBase64": "截图 base64（必需）",
  "mimeType": "image/png",
  "title": "游戏标题（可选）",
  "style": "sketch | flat | pixel | neon | minimal"
}
```

**Prompt 设计要点**：

- 让模型扮演“专业游戏视觉设计师”
- 强制输出合法 JSON：`{ svg, description, theme }`
- SVG 规范：
  - `viewBox="0 0 360 480"`，适合卡片封面
  - 自包含、内联样式、无外部资源
  - 不使用 `<foreignObject>`、CSS 动画
  - 不直接包含文字内容，仅图形元素
- 风格提示中写死了手绘风格颜色（`#faf7ef`、`#ffda6a` 等），这是当前 AI 生成场景中的例外，因为需要直接约束模型输出

**输出**：

```json
{
  "ok": true,
  "svg": "<svg>...</svg>",
  "description": "设计说明",
  "theme": "主题关键词",
  "style": "sketch",
  "usage": { "input_tokens": 1234, "output_tokens": 5678 }
}
```

### 3.2 生成界面示意图：`/api/ai/generate-sketch`

文件：`src/app/(site)/api/ai/generate-sketch/route.ts`

**输入**：

```json
{
  "imageBase64": "截图 base64（必需）",
  "mimeType": "image/png",
  "gameUrl": "游戏地址（可选）",
  "style": "wireframe | rough | colored | isometric"
}
```

**Prompt 设计要点**：

- 让模型扮演“擅长游戏界面线框图设计的 UI/UX 设计师”
- 输出 JSON：`{ svg, description, uiElements }`
- SVG 规范：
  - 根据截图比例自适应 `viewBox`，建议宽度 400-800px
  - 简化复杂画面为几何图形
  - 用引线和中文标注关键 UI 元素
  - **避免使用 `<text>` 标签**（字体渲染不稳定），用几何图形代替文字
  - 自包含、无外部资源、无动画

### 3.3 生成 Mermaid 流程图：`/api/ai/generate-flowchart`

文件：`src/app/(site)/api/ai/generate-flowchart/route.ts`

虽然不是直接生成 SVG，但它是 AI 分析链路的重要一环：

- 输入：游戏源码目录 `sourceDir`（可选截图 `imageBase64`）
- Prompt：让模型从源码中提取“初始化 → 主循环 → 输入处理 → 状态机 → 胜负判定 → 核心算法”
- 输出 JSON：`{ mermaid, description, nodes, keyLogic }`
- 前端可进一步用 Mermaid 库渲染为 SVG/PNG

### 3.4 全面分析：`/api/ai/analyze-game`

文件：`src/app/(site)/api/ai/analyze-game/route.ts`

一站式分析，返回结构化报告，其中包含：

- `flowchartMermaid`：流程图
- `coverTemplate`：推荐使用的本地 SVG 模板 key
- `article`：完整 MDX 文章
- 标题、标签、难度、技术栈、核心点、代码片段等

全面分析完成后，前端把结果写入 `localStorage`，并跳转 `/mod/new` 自动填充新帖表单。

---

## 四、前端调用与展示

### 4.1 入口组件：`GameAnalyzer`

文件：`src/components/mod/GameAnalyzer.tsx`

- 通过 `/mod` 页面的“🤖 分析游戏”按钮打开弹窗
- 提供 4 种模式：
  - `full`：全面分析（调用 `/api/ai/analyze-game`）
  - `cover`：生成 SVG 封面（调用 `/api/ai/generate-cover`）
  - `flowchart`：生成流程图（调用 `/api/ai/generate-flowchart`）
  - `sketch`：生成界面示意图（调用 `/api/ai/generate-sketch`）
- 上传截图 → base64 → POST 到对应 API → 解析结果 → 渲染/复制/下载

### 4.2 封面结果展示

`CoverResultView` 提供：

- SVG 预览（通过 `data:image/svg+xml;base64` 内联）
- 复制 SVG 源码
- 下载 SVG 文件
- 导出为 PNG/JPG/WebP（调用 `svgToBitmap`）

### 4.3 示意图结果展示

`SketchResultView` 提供：

- SVG 预览
- 设计说明
- 识别到的 UI 元素标签
- 复制/下载 SVG、导出位图

---

## 五、本地程序化 SVG 生成（RoughJS）

### 5.1 生成器

文件：`src/lib/sketch-svg/generator.ts`

- 基于 `roughjs` 的 `generator()` API
- 预定义了多种手绘风格图形：
  - 基础图形：`rectangle`、`circle`、`ellipse`、`line`、`arrow`、`star`、`cross`、`diamond`
  - 流程图：`flow-start`、`flow-process`、`flow-decision`、`flow-end`
  - 游戏元素：`gamepad`、`card`、`gem`、`puzzle`、`tower`、`runner`、`skull`、`blocks`、`flipped-cards`
  - 装饰元素：`note`、`lightbulb`、`sun`、`question-mark`、`sparkle`
- 默认样式：
  - `roughness: 2`
  - `bowing: 1`
  - `stroke: #202020`
  - `strokeWidth: 2`
  - `fill: #faf7ef`
  - `fillStyle: hachure`
- 导出函数：
  - `generateSketchSvg(options)`：返回 SVG 字符串
  - `generateSketchSvgDataUrl(options)`：返回 base64 data URL
  - `sketchSvgPresets`：预设列表，供 UI 选择

### 5.2 批量素材脚本

文件：`scripts/generate-svg-assets.ts`

运行方式：

```bash
npx tsx scripts/generate-svg-assets.ts
```

输出目录：`public/svg/`

- `public/svg/hero/`：首页 Hero 区装饰图标（gamepad、note、sun 等）
- `public/svg/covers/`：玩法封面预设图（memory-match、tower-defense 等）
- `public/svg/icons/`：母型玩法小图标（match-3、deck-builder 等）
- `public/svg/hero/flowchart.svg`：组合流程图大图

### 5.3 发帖页快速封面

文件：`src/components/mod/CoverGenerator.tsx`

- 不调用 AI，直接通过 `generateSketchSvgDataUrl` 生成本地手绘封面
- 提供 10 种模板选择
- 生成后可作为 `coverSvgDataUrl` 写入新帖，保存到 `public/plays/<slug>/`

---

## 六、SVG 位图导出

文件：`src/lib/svg-export.ts`

- 使用浏览器 Canvas API 将 SVG 渲染为位图
- 支持格式：`png`、`jpg`、`webp`
- 支持自定义宽高、JPG 背景色
- 导出函数：
  - `svgToBitmap(options)`：返回 `Blob`
  - `downloadBlob(blob, filename)`：触发浏览器下载
  - `exportSvgToFile(svg, format, filename)`：组合导出

---

## 七、权限与安全

- 所有 `/api/ai/*` 路由都读取 `cookies()`，校验 `MOD_COOKIE`
- 非版主返回 `401 Unauthorized`
- 图片 base64 不持久化存储，仅在单次请求中传递
- API Key 仅存于服务端环境变量，不暴露给前端

---

## 八、调用链路示例

### 8.1 AI 生成封面

```
用户上传截图
  ↓
GameAnalyzer 将 File → base64
  ↓
POST /api/ai/generate-cover
  ↓
服务端校验版主权限
  ↓
构造多模态 Prompt + image block
  ↓
调用 Kimi Code API (kimi-k2-6)
  ↓
解析返回 JSON 中的 svg 字段
  ↓
前端预览、复制、下载或导出位图
```

### 8.2 本地生成封面

```
发帖页选择模板 → CoverGenerator
  ↓
generateSketchSvgDataUrl({ type, width: 360, height: 480 })
  ↓
RoughJS 生成手绘 SVG
  ↓
Base64 Data URL 作为 coverSvgDataUrl
  ↓
提交表单时写入 public/plays/<slug>/cover.svg
```

---

## 九、关键文件索引

| 文件 | 说明 |
|------|------|
| `src/lib/ai/moonshot.ts` | Kimi API 客户端 |
| `src/lib/ai/analyze-utils.ts` | 图片块构造、JSON 解析、源码读取 |
| `src/app/(site)/api/ai/generate-cover/route.ts` | SVG 封面生成接口 |
| `src/app/(site)/api/ai/generate-sketch/route.ts` | SVG 界面示意图生成接口 |
| `src/app/(site)/api/ai/generate-flowchart/route.ts` | Mermaid 流程图生成接口 |
| `src/app/(site)/api/ai/analyze-game/route.ts` | 全面分析接口 |
| `src/components/mod/GameAnalyzer.tsx` | AI 分析弹窗与结果展示 |
| `src/components/mod/CoverGenerator.tsx` | 本地手绘封面快速生成 |
| `src/lib/sketch-svg/generator.ts` | RoughJS 程序化 SVG 生成 |
| `scripts/generate-svg-assets.ts` | 批量生成静态 SVG 素材 |
| `src/lib/svg-export.ts` | SVG 转 PNG/JPG/WebP |
| `scripts/test-kimi-api.ts` | Kimi API 连通性测试脚本 |

---

## 十、后续可扩展方向

1. **模板化 SVG**：把 AI 生成的封面进一步规范化为可替换图层的模板，便于批量生成统一风格封面。
2. **流式生成**：在 `GameAnalyzer` 中使用 `chatStream` 实现渐进式渲染，降低等待感知。
3. **SVG 后处理**：对 AI 返回的 SVG 做 sanitize/压缩，确保无外部引用、尺寸合理。
4. **Mermaid 渲染**：在详情页直接渲染 `flowchartMermaid` 为 SVG，替代目前的纯文本展示。
5. **A/B 风格固化**：把当前 prompt 中写死的颜色值逐步收敛到设计系统 Token，并支持 prompt 版本管理。
