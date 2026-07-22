# OVOFORGE UI 设计系统规范（全站统一）

> 本文件是站点 UI 的唯一规范。新增/修改任何 UI 元素前必读。
> 目标：全站 UI 有系统性统一的结构，禁止页面各自为政、样式写死。

---

## 〇、硬规则（违反即返工）

1. **禁止写死**：字体、颜色、边框、阴影一律使用本规范的设计令牌与组件类，禁止在页面里临时拼新样式。
2. **自定义 CSS 必须放进层**：`globals.css` 里任何手写规则必须包在 `@layer base`（元素级）或 `@layer components`（组件类）中。**严禁无层级裸写**——无层级样式优先级高于 Tailwind 工具类，会造成"工具类莫名失效"的隐蔽 bug（2026-07-22 `button{font:inherit}` 事件的根因）。
3. **字体**：标题/按钮/标签用 `font-kalam`（Kalam 手绘体）；正文用默认 sans。按钮文字**必须** Kalam。
4. **语言一致**：同类元素全站同一套类，不搞"这个页面特供版"。

## 一、设计令牌（globals.css :root）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--paper-bg` | #faf7ef | 纸底（全站背景） |
| `--paper-bg-warm` | #f5f1e6 | 暖纸（次级区块） |
| `--ink` | #202020 | 墨色（正文/主文字） |
| `--ink-soft / --ink-faint` | 55% / 35% 透明墨 | 边框/弱文字 |
| `--highlight-yellow/blue/red/green/orange` | 高亮色 | 语义点缀（黄=主操作，蓝=次操作，红=危险，绿=成功） |
| `--font-kalam` | Kalam, cursive | 手绘字体 |

## 二、风格基调（旧报纸简约风）

- 边框：**1px** `var(--ink-soft)` 细线，圆角 3-4px。**禁止** 2px+ 粗边框
- 阴影：近乎无（`sketch-shadow` 系列 0-2px）
- 旋转：无（`sketch-rotate-*` 已置零）
- 画感：纸底墨线，高亮色只做点缀不大面积铺

## 三、组件类清单（globals.css，统一使用）

| 类 | 用途 |
|---|---|
| `.sketch-border` | 1px 细边框（标准） |
| `.sketch-border-thin / -thick / -dashed` | 变体（thin=更浅，thick=强调，dashed=虚线） |
| `.sketch-card` | 卡片（边框+纸底） |
| `.sketch-card-warm` | 暖纸卡片 |
| `.sketch-button` | 按钮（Kalam、1px 边、黄底；配 `-secondary` 纸底 / `-ghost` 无边） |
| `.sketch-input` | 输入框 |
| `.sketch-pill` | 标签 pill（配 `-primary` / `-neutral`） |
| `.sketch-divider` | 细直线分隔 |
| `.sketch-section` | 区块容器 |

## 四、按钮规范（全站唯一）

- **尺寸**：高 `h-9`（36px），横向 padding `px-4`，字号 `text-xs`（12px）
- **字体**：Kalam（手绘体）
- **形状**：`rounded-full`（胶囊）
- **边框**：`sketch-border`（1px）
- **底色语义**：黄=主操作（生成/确认），纸底=普通（编辑/复制），红字=危险（删除），绿字=成功状态（已发布）
- **禁止**：突然出现更大/更小/其它字体的按钮；按钮文字禁止两行（`whitespace-nowrap`）

参考实现：`src/components/mod/CopyDemoLinkButton.tsx`、`DeletePlayButton.tsx`、`TogglePublishButton.tsx`（均显式锁定 `fontFamily: var(--font-kalam)`）。

## 五、表单/弹窗规范

- 弹窗：一律用 `src/components/ui/AppDialog.tsx`（`useAppDialog().confirm/alert`），**禁止**浏览器原生 confirm/alert
- 表单输入：`sketch-input`；标签：`font-kalam text-xs text-ink-muted`
- 表格：桌面宽表只在 `lg:` 以上出现；`lg` 以下用卡片式布局

## 六、封面/图片规范

- 封面统一 **480×360 webp（4:3，≤15KB）**，由 `src/lib/cover-gen/` 蚀刻风引擎生成；不区分横竖版
- 禁止在图内放文字；不使用游戏截图做封面
- 详情页 demo 容器按游戏方向自适应（竖屏 3:4 限宽居中 / 横屏 16:10）

## 七、层级事故备忘（2026-07-22）

症状：按钮字号 16px 不随 text-xs 变化。
根因：`globals.css` 无层级裸写 `button { font: inherit; }`，优先级压过 Tailwind 工具类。
修复：收进 `@layer base`。**以后任何手写 CSS 先问一句：放进哪个 layer？**
