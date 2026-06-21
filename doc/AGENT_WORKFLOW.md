# OVO Agent 工作流规范

> 本文件规定 AI/协作者如何与 OVO 项目持续协作、记忆状态、推进目标。
> 每次新会话启动时，必须先读取 `memory/` 下的状态文件（见 `AGENTS.md` 的阅读顺序）。

---

## 一、核心原则

1. **状态优先于扫描**：新会话不从头读仓库，先读 `memory/STATUS.md` + `memory/GOALS.md` + `memory/BACKLOG.md`。
2. **小事直接做，大事先记录**：任何会改变架构、接口或用户流程的改动，先写入 `memory/DECISIONS.md` 再实施。
3. **结束即更新**：每次工作结束前，更新 `memory/STATUS.md`、当日笔记 `memory/daily/YYYY-MM-DD.md`、`memory/BACKLOG.md`。
4. **Git 是真相源**：`memory/` 只记录认知状态，不替代 Git；重要代码改动必须提交。

---

## 二、记忆文件职责

| 文件 | 职责 | 更新时机 |
|---|---|---|
| `memory/STATUS.md` | 项目当前快照：已完成的、进行中的、阻塞、健康检查 | 每次会话结束；有重大状态变化时 |
| `memory/GOALS.md` | 当前阶段目标与里程碑 | 目标变更、里程碑达成 |
| `memory/BACKLOG.md` | 任务清单（Kanban：In Progress / Todo / Done） | 任务起止、新增、取消 |
| `memory/DECISIONS.md` | 关键架构/产品决策记录 | 做重大决策时 |
| `memory/daily/YYYY-MM-DD.md` | 当日工作笔记：做了什么、验证结果、下一步 | 每个工作日结束时 |

---

## 三、会话启动流程

新会话按以下顺序读取文件：

1. `README.md`
2. `doc/AGENT_CONTEXT.md`
3. `memory/STATUS.md`
4. `memory/GOALS.md`
5. `memory/BACKLOG.md`
6. 如果涉及具体功能，再读相关代码文件

禁止在没读记忆文件前做"全仓库扫描"。

---

## 四、任务推进流程

### 1. 认领任务

从 `memory/BACKLOG.md` 的 **Todo** 区选一个任务，移到 **In Progress**，并记录开始时间。

### 2. 实施

- 做最小可验证改动
- 优先复用现有组件/类型/工具（如 `server/demos/archetypes/shared.ts`、`SketchCard`）
- 改完运行 `pnpm typecheck`，若涉及 UI 则 `pnpm dev` 验证

### 3. 记录

- 更新 `memory/BACKLOG.md`：任务移到 **Done**，写清完成标准和验证方式
- 更新 `memory/STATUS.md`：当前状态、阻塞、下一步
- 更新当日笔记

### 4. 提交

- `git status` 检查改动范围
- 只提交与任务相关的文件
- commit message 格式：`[<模块>] <做了什么>`，例如 `[patterns] 新增核心原型数据层与导航筛选`

---

## 五、健康检查命令

每次会话开始时可选运行：

```bash
pnpm -s typecheck   # TypeScript 检查
pnpm -s build       # 生产构建（需要时）
git status --short  # 查看未提交改动
```

结果写入 `memory/STATUS.md` 的"健康检查"小节。

---

## 六、当前阶段重点

本阶段目标见 `memory/GOALS.md` 与 `memory/BACKLOG.md`：

> **P0 基础一期已上线交付完成**。当前重心已转向：
> 1. **生产部署**：按 `doc/server-deployment-checklist.md` 完成服务器配置、Nginx/SSL、CI/CD。
> 2. **P1 体验优化**：`<img>` 迁移 `next/image`、搜索高亮与空状态、联系表单邮件/webhook、版主发帖增强等。
> 3. **P2 能力扩展**：参数化 Demo 引擎、玩法组合系统、独立详情页等。
>
> 所有工作应围绕上述目标展开，避免无关重构。
