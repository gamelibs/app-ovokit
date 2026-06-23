# OVOFORGE H5 试玩游戏开发规范

> 本规范用于指导在外部工具/仓库中开发 OVOFORGE 站点的 H5 试玩 Demo。  
> 目标：每个母型玩法（12 种）和核心原型（5 种）都有一个独立、可嵌入、可重启、移动端友好的 H5 Demo。

---

## 一、总体原则

1. **独立开发**：Demo 不在主站 Next.js 仓库中开发，统一在 `ovoforge-demos`（或外部指定目录）中作为纯 H5 项目实现。
2. **按 ID 映射**：每个 Demo 通过唯一的 `demoId` 与主站内容对应，主站通过 iframe 加载。
3. **最小可玩**：30 秒内能理解规则，60 秒内能体验到核心循环。
4. **可视化优先**：必须有图形/动画反馈，不能只是数字和按钮。
5. **移动优先**：优先保证触摸操作流畅，PC 端用鼠标/键盘兼容。
6. **可嵌入**：必须能被主站 iframe 嵌入，支持 `postMessage` 重启和尺寸适配。

---

## 二、目录与 URL 约定

### 2.1 外部 Demo 仓库结构

```
ovoforge-demos/
├── README.md
├── package.json              # 构建脚本
├── public/
│   └── demos/                # 构建后输出目录
│       ├── archetype-match-clear/
│       │   └── index.html
│       ├── pattern-action/
│       │   └── index.html
│       ├── play-match-3-retention-and-pacing/
│       │   └── index.html
│       └── ...
├── src/
│   ├── shared/               # 共享工具：尺寸适配、postMessage、重启
│   └── demos/                # 每个 Demo 的源码目录
│       ├── archetype-match-clear/
│       ├── pattern-action/
│       └── ...
└── dist/                     # 本地构建产物（部署时复制到 CDN）
```

### 2.2 URL 映射规则

主站通过以下规则把内容 key/slug 映射到 Demo URL：

| 内容类型 | Demo ID 规则 | 示例 URL |
|---|---|---|
| 母型玩法 | `archetype-{key}` | `https://demos.ovoforge.com/demos/archetype-match-clear/index.html` |
| 核心原型 | `pattern-{key}` | `https://demos.ovoforge.com/demos/pattern-action/index.html` |
| 玩法帖子 | `play-{slug}` | `https://demos.ovoforge.com/demos/play-match-3-retention-and-pacing/index.html` |

其中 `{key}` 和 `{slug}` 与主站内容保持一致，详见下方列表。

---

## 三、技术栈建议

- **推荐引擎/框架**：
  - Phaser 3（2D 游戏首选）
- **不推荐**：
  - 仅使用 DOM + CSS 动画做交互游戏（性能/触摸体验差）
  - 每步操作依赖服务器 API 的架构
- **构建输出**：
  - 每个 Demo 必须输出为独立的 `index.html` + 静态资源
  - 资源总大小控制在 **3MB 以内**（首屏加载 < 2s）
  - 推荐启用 gzip/brotli 压缩

---

## 四、通信协议（postMessage）

主站与 Demo 通过 `postMessage` 通信。

### 4.1 主站 → Demo

Demo 必须监听以下消息：

```js
window.addEventListener("message", (e) => {
  // 安全校验：只接受同源或指定域名
  if (e.origin !== "https://ovoforge.com") return;

  const { type } = e.data || {};
  if (type === "demo:restart") {
    restartGame();
  }
});
```

### 4.2 Demo → 主站（可选）

Demo 可以主动上报状态：

```js
parent.postMessage(
  { type: "demo:ready" },
  "https://ovoforge.com"
);

parent.postMessage(
  { type: "demo:score", payload: { score: 120, level: 3 } },
  "https://ovoforge.com"
);
```

常用事件：

| 事件 | 含义 |
|---|---|
| `demo:ready` | Demo 初始化完成，可以交互 |
| `demo:loading` | Demo 正在加载资源 |
| `demo:error` | Demo 初始化失败 |
| `demo:score` | 上报分数/进度 |
| `demo:complete` | 玩家完成一局/一关 |

---

## 五、响应式与尺寸

### 5.1 iframe 容器尺寸

主站容器默认：

```css
min-h-[360px] h-[60vh] w-full sm:h-auto sm:aspect-[4/3] lg:aspect-[16/10]
```

即移动端高度约为视口 60%，PC 端为 4:3 或 16:10 比例。

### 5.2 Demo 适配要求

- Demo 内部必须监听 `window resize`，动态调整 canvas/布局。
- 推荐以 **竖屏优先** 设计，横屏时内容居中、背景延展。
- 所有可交互元素在移动端最小触摸尺寸 **44×44px**。
- 文字在移动端不小于 **14px**，重要按钮不小于 **16px**。

### 5.3 推荐设计尺寸

- 设计稿基准：`750×1334`（竖屏）或 `960×600`（横屏）
- Canvas 实际尺寸按容器等比缩放，保持内容完整可见
- 避免黑边：背景图/色块可以溢出，核心玩法区域保持安全框内

---

## 六、性能与加载

- **首屏可交互时间 < 3s**（3G 网络下 < 5s）
- 资源懒加载：非首屏资源按需加载
- 音效文件使用 `.mp3` 或 `.ogg`，单文件 < 200KB
- 图片纹理优先使用 `.webp` 或 `.png`（带压缩）
- 建议使用预加载进度条，避免白屏

---

## 七、重启机制

Demo 内部必须实现 `restartGame()` 函数，响应 `demo:restart` 消息：

```js
function restartGame() {
  // 1. 停止当前游戏循环
  // 2. 重置所有状态（分数、关卡、实体）
  // 3. 重新初始化场景
  // 4. 发送 demo:ready 事件
}
```

**禁止**：直接 `window.location.reload()` 来重启（会导致 iframe 闪白、重新加载资源）。

---

## 八、输出规范

每个 Demo 目录必须包含：

```
demos/{demoId}/
├── index.html          # 入口文件
├── main.js / main.*.js # 构建后的 JS
├── assets/             # 图片、音效、字体
│   ├── images/
│   └── sounds/
└── README.md           # 该 Demo 的简要说明（可选但推荐）
```

`index.html` 必须：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>{Demo 名称}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #faf7ef; }
    #game { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script src="./main.js"></script>
</body>
</html>
```

---

## 九、测试清单

在提交 Demo 前，请确认：

- [ ] 按 `demoId` 命名的目录结构正确
- [ ] `index.html` 可以直接在浏览器打开并运行
- [ ] 在 Chrome DevTools 移动端模拟器中操作流畅
- [ ] 横竖屏切换后布局正常
- [ ] 主站发送 `demo:restart` 后游戏能正确重启
- [ ] 没有每步操作请求服务器的依赖
- [ ] 资源总大小 < 3MB
- [ ] 首次加载到可交互 < 3s
- [ ] 无 console error

---

## 十、12 种母型玩法 Demo 详细说明

### 1. archetype-match-clear · 消除（Match/Clear）

| 项目 | 说明 |
|---|---|
| **核心体验** | 交换相邻元素形成 ≥3 同色匹配，触发消除、下落、连锁 |
| **最小规则** | 8×8 棋盘；点击两个相邻格子交换；横竖 ≥3 同色消除；消除后上方下落、顶部补充新元素；连锁继续计分 |
| **推荐操作** | 点击/拖拽交换（移动端触摸，PC 鼠标） |
| **胜负判定** | 无失败条件；限时 60 秒或限步 20 步，得分越高越好 |
| **设计要点** | 必须有消除动画、下落动画、连锁提示音；展示"可控随机"——保证每局初始至少有一个可匹配 |
| **复杂度控制** | 只做基础三消，不做特殊块、关卡目标、道具 |

### 2. archetype-dodge-avoid · 躲避（Dodge/Avoid）

| 项目 | 说明 |
|---|---|
| **核心体验** | 在持续生成的障碍物中生存，体验"近失"紧张感 |
| **最小规则** | 玩家控制一个圆形角色在屏幕底部左右移动；上方不断下落障碍物；碰撞扣血；擦边通过有加分/特效 |
| **推荐操作** | 拖拽移动（移动端），鼠标/左右方向键（PC） |
| **胜负判定** | HP 归零则失败；坚持时间越长分数越高 |
| **设计要点** | 障碍物下落速度逐渐加快；加入"近失判定"（擦边时角色发光/时间变慢）；展示难度曲线 |
| **复杂度控制** | 单种障碍物，不做 BOSS、技能、升级 |

### 3. archetype-runner · 行进 / 跑酷（Runner）

| 项目 | 说明 |
|---|---|
| **核心体验** | 自动前进中跳跃/滑铲躲避障碍，体验速度节奏 |
| **最小规则** | 角色自动向右跑；点击跳跃，下滑躲避空中障碍；碰到障碍减速/失败；连续躲避加分 |
| **推荐操作** | 点击跳跃，向下滑动滑铲 |
| **胜负判定** | 摔倒/碰撞 3 次失败；跑距越远分数越高 |
| **设计要点** | 速度逐步提升；障碍生成有可预测节拍；展示"前期教活、中期教稳、后期教秀"的节奏 |
| **复杂度控制** | 单一场景，不做道具、角色升级、多 lane |

### 4. archetype-shoot-aim · 射击（Shoot/Aim）

| 项目 | 说明 |
|---|---|
| **核心体验** | 瞄准、射击、装填，体验命中反馈与资源管理 |
| **最小规则** | 屏幕上方随机出现目标；玩家拖动准星瞄准；点击射击；弹药有限，自动或手动装填；命中得分 |
| **推荐操作** | 拖拽瞄准 + 点击射击（移动端），鼠标移动 + 点击（PC） |
| **胜负判定** | 限时 60 秒，命中越多分数越高；空枪不惩罚 |
| **设计要点** | 目标出现有提示；命中要有明显特效和音效；展示"装填"造成的节奏停顿 |
| **复杂度控制** | 单种目标，不做移动目标、连发、暴击 |

### 5. archetype-combat · 战斗对抗（Combat）

| 项目 | 说明 |
|---|---|
| **核心体验** | 攻防节奏：攻击、格挡、技能，体验窗口与资源博弈 |
| **最小规则** | 玩家 vs 敌人回合制；玩家可选择攻击/格挡/技能；敌人有读条攻击；格挡可减伤；技能消耗能量 |
| **推荐操作** | 点击三个大按钮 |
| **胜负判定** | 敌人 HP 归零胜利；玩家 HP 归零失败 |
| **设计要点** | 敌人攻击前有明显前摇；展示"读招-应对-反击"循环；能量条和技能 CD 可视化 |
| **复杂度控制** | 一个敌人，一种技能，不做装备、buff、多敌人 |

### 6. archetype-placement · 放置 / 建造（Placement）

| 项目 | 说明 |
|---|---|
| **核心体验** | 在有限空间内放置物件，体验布局决策与产出节拍 |
| **最小规则** | 6×6 网格；点击选择建筑类型（生产/连接/存储）；点击空地放置；相邻同类型建筑可升级；tick 产出金币 |
| **推荐操作** | 点击选择 + 点击放置 |
| **胜负判定** | 无失败；展示在有限步数/空间内的产出效率 |
| **设计要点** | 放置前显示预览和高亮；合并升级有动画；展示"空间是硬约束" |
| **复杂度控制** | 2 种建筑，不做资源链、敌人、科技树 |

### 7. archetype-choice-strategy · 策略决策（Choice/Strategy）

| 项目 | 说明 |
|---|---|
| **核心体验** | 每回合三选一，把随机事件转化为玩家选择 |
| **最小规则** | 玩家有血量、金币、战力；每回合出现 3 个选项；选择后触发收益/代价；连续多回合生存 |
| **推荐操作** | 点击选项卡片 |
| **胜负判定** | 血量归零失败；存活 10 回合胜利 |
| **设计要点** | 选项结果可预测（有图标说明）；展示"把随机变成选择"；难度递进 |
| **复杂度控制** | 固定 3 选 1，不做卡组、地图、多路径 |

### 8. archetype-physics · 物理（Physics）

| 项目 | 说明 |
|---|---|
| **核心体验** | 拖拽/切割/抛射，体验可预期物理反馈 |
| **最小规则** | 屏幕上有一个目标物和一个触发区；玩家用手指划线切割或拖拽抛射；让目标物落入触发区 |
| **推荐操作** | 拖拽/滑动（切割或抛射） |
| **胜负判定** | 目标物进入触发区胜利；掉落屏幕外失败；可重试 |
| **设计要点** | 物理运动平滑可预测；失败后一键重置；展示"可解释物理" |
| **复杂度控制** | 单一场景，2-3 个刚体，不做复杂机关 |

### 9. archetype-puzzle · 解谜（Puzzle）

| 项目 | 说明 |
|---|---|
| **核心体验** | 观察规则、试错、找到解法，体验"啊哈"瞬间 |
| **最小规则** | 5×5 网格，部分格子为墙；玩家点击格子切换颜色；目标是把所有格子变成同一颜色/点亮所有格子 |
| **推荐操作** | 点击格子 |
| **胜负判定** | 达成目标状态胜利；可重置 |
| **设计要点** | 初始关卡有唯一解或简单解；点击后有连锁反馈；提供"重置"和"提示"按钮 |
| **复杂度控制** | 3 关递进，不做随机生成、时间限制 |

### 10. archetype-progression · 成长 / 数值（Progression）

| 项目 | 说明 |
|---|---|
| **核心体验** | 每局推进获得资源，局外升级，体验"失败即成长" |
| **最小规则** | 点击"探索"随机遭遇事件（战斗/宝藏/陷阱）；探索越深收益越高但危险越大；失败后获得永久货币用于升级 |
| **推荐操作** | 点击"探索"按钮；遇到事件时选择战斗/逃跑 |
| **胜负判定** | 战斗中 HP 归零本局结束；局外升级后下一局更强 |
| **设计要点** | 展示"失败也给进度"；局外升级曲线可见；避免"故意失败最优" |
| **复杂度控制** | 一个升级项（攻击力），不做复杂装备、天赋树 |

### 11. archetype-simulation · 模拟（Simulation）

| 项目 | 说明 |
|---|---|
| **核心体验** | 调整参数观察系统演化，体验因果链 |
| **最小规则** | 一个小城镇模拟：调整税率；人口、幸福度、收入随时间变化；观察长期趋势 |
| **推荐操作** | 拖动滑块调整税率；点击"过一天"推进 |
| **胜负判定** | 无失败；展示不同税率下的曲线变化 |
| **设计要点** | 实时图表展示人口/幸福度/收入；参数变化立即反馈；展示"可解释回路" |
| **复杂度控制** | 3 个变量，不做灾难、科技、多城市 |

### 12. archetype-timing · 时机 / 反应（Timing）

| 项目 | 说明 |
|---|---|
| **核心体验** | 在节拍/窗口出现时点击，体验 Perfect/Good/Miss 反馈 |
| **最小规则** | 一个圆环从中心扩大到目标环；玩家在圆环与目标环重合时点击；判定 Perfect/Good/Miss |
| **推荐操作** | 点击屏幕任意位置 |
| **胜负判定** | 连续 10 个节拍；Miss 过多失败；得分按判定计算 |
| **设计要点** | 视觉节拍提示清晰；判定瞬间有闪光和音效；展示判定窗口对体验的影响 |
| **复杂度控制** | 单一节拍，不做多键、音乐同步、连击链 |

---

## 十一、5 种核心原型 Demo 详细说明

### 1. pattern-action · 动作反应

| 项目 | 说明 |
|---|---|
| **核心循环** | Input → Avatar → Physics → Score |
| **Demo 目标** | 展示"输入 → 状态更新 → 碰撞 → 反馈"的实时循环 |
| **最小规则** | 玩家控制一个方块左右移动，躲避从上方落下的障碍物；碰撞扣血；连续躲避加分 |
| **设计要点** | 输入延迟尽量低；碰撞判定可视化（显示碰撞盒）；展示速度/密度难度曲线 |
| **复杂度控制** | 单场景，单障碍物类型 |

### 2. pattern-spatial · 空间规划

| 项目 | 说明 |
|---|---|
| **核心循环** | Board → Cell → Rule → State Change |
| **Demo 目标** | 展示网格/棋盘上的规则应用与状态变化 |
| **最小规则** | 4×4 数字板；滑动合并相同数字；每次滑动后随机生成新数字；目标合成 2048 |
| **设计要点** | 滑动动画流畅；合并有音效和缩放反馈；展示"状态空间"和"规则判定" |
| **复杂度控制** | 只做 2048 核心规则，不做道具、 Undo |

### 3. pattern-merge · 合成成长

| 项目 | 说明 |
|---|---|
| **核心循环** | Resource → Merge → Level Up → Production |
| **Demo 目标** | 展示"低等级合并为高等级，产出提升"的循环 |
| **最小规则** | 8 个格子背包；点击生成 Lv.1 资源；两个 Lv.N 可合并为 Lv.N+1；最高等级决定每秒产出 |
| **设计要点** | 合并动画和升级特效；产出数字跳动；展示成长曲线 |
| **复杂度控制** | 单一资源链，不做配方、稀有掉落 |

### 4. pattern-management · 经营模拟

| 项目 | 说明 |
|---|---|
| **核心循环** | Building → Production → Economy → Growth |
| **Demo 目标** | 展示"建造 → 生产 → 出售 → 扩张"的经济循环 |
| **最小规则** | 点击建造农田；农田随时间产出小麦；点击收获；出售小麦获得金币；金币用于建造更多农田 |
| **设计要点** | 进度条显示生产时间；金币数字实时更新；展示瓶颈和扩张 |
| **复杂度控制** | 一种建筑，一种资源，不做库存上限、市场波动 |

### 5. pattern-strategy · 策略成长

| 项目 | 说明 |
|---|---|
| **核心循环** | Unit → Stats → Combat → Reward |
| **Demo 目标** | 展示"单位属性 → 战斗计算 → 成长奖励"的数值对抗 |
| **最小规则** | 玩家一个单位，敌人一个单位；轮流行动；可选择攻击/防御/技能；伤害按攻击力-防御力计算；胜利获得经验升级 |
| **设计要点** | 战斗公式可视化（显示伤害计算过程）；升级后属性提升明显；展示克制和策略选择 |
| **复杂度控制** | 一个玩家单位，一个敌人，一个技能 |

---

## 十二、与主站集成

完成 H5 Demo 后，只需更新主站内容配置：

### 母型/核心原型页面

母型和核心原型页面的 `DemoEmbed` 会自动加载：

```
/embed/demos/archetype/{key}   → 改为 →  https://demos.ovoforge.com/demos/archetype-{key}/index.html
/embed/demos/pattern/{key}     → 改为 →  https://demos.ovoforge.com/demos/pattern-{key}/index.html
```

### 玩法帖子

在对应 `content/plays/{slug}/meta.json` 中配置：

```json
{
  "demo": {
    "iframeSrc": "https://demos.ovoforge.com/demos/play-{slug}/index.html",
    "note": "该玩法提供独立 H5 试玩 Demo。"
  }
}
```

### 部署流程

1. 外部 Demo 仓库构建输出到 `dist/demos/`
2. 上传 `dist/demos/` 到 CDN（如 Cloudflare R2 / 阿里云 OSS / 服务器 Nginx 静态目录）
3. 主站无需重新构建，更新 meta.json 中的 `iframeSrc` 即可生效

---

## 十三、验收标准

每个 Demo 上线前需满足：

| 维度 | 标准 |
|---|---|
| **可玩性** | 30 秒内理解规则，能完成至少一局 |
| **可视化** | 有图形、动画、音效，不是纯数字 |
| **移动端** | 触摸操作流畅，无遮挡、无黑边 |
| **重启** | 支持 `postMessage` 重启，无闪白 |
| **性能** | 首屏 < 3s，运行帧率稳定 |
| **无依赖** | 不调用主站 API，纯前端运行 |
| **映射正确** | URL 和 demoId 与规范一致 |

---

## 十四、附录：Demo ID 速查表

### 母型（12）

| key | demoId | 名称 |
|---|---|---|
| match-clear | `archetype-match-clear` | 消除 |
| dodge-avoid | `archetype-dodge-avoid` | 躲避 |
| runner | `archetype-runner` | 行进 / 跑酷 |
| shoot-aim | `archetype-shoot-aim` | 射击 |
| combat | `archetype-combat` | 战斗对抗 |
| placement | `archetype-placement` | 放置 / 建造 |
| choice-strategy | `archetype-choice-strategy` | 策略决策 |
| physics | `archetype-physics` | 物理 |
| puzzle | `archetype-puzzle` | 解谜 |
| progression | `archetype-progression` | 成长 / 数值 |
| simulation | `archetype-simulation` | 模拟 |
| timing | `archetype-timing` | 时机 / 反应 |

### 核心原型（5）

| key | demoId | 名称 |
|---|---|---|
| action | `pattern-action` | 动作反应 |
| spatial | `pattern-spatial` | 空间规划 |
| merge | `pattern-merge` | 合成成长 |
| management | `pattern-management` | 经营模拟 |
| strategy | `pattern-strategy` | 策略成长 |
