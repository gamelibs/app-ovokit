# Agent 自动任务推进工作流

> 文件：`scripts/agent-task-runner.ts`
> 用途：让 Agent 会话启动后能快速认领下一项最高优先级任务，并输出可直接执行的 prompt。

---

## 快速使用

```bash
# 预览下一任务（不修改 memory）
pnpm agent:dry

# 认领下一任务并将其标记为 In Progress，同时输出 prompt
pnpm agent:next

# 自动调用 kimi CLI 执行（需设置 KIMI_AUTO_RUN=1，不推荐 P0）
pnpm agent:run
```

---

## 任务元数据约定

`memory/BACKLOG.md` 中的任务标题后可附加 HTML 注释，供脚本解析：

```markdown
- [ ] **版主鉴权安全加固** <!-- task:id=auth-001 priority:P0 category:blocker -->
  - 文件：`src/lib/mod/auth.ts`、`src/app/(site)/api/mod/login/route.ts`
  - 目标：改为基于 MOD_PASSWORD 的签名 cookie
  - 验收：伪造 cookie 无法通过鉴权
```

支持的字段：

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `task:id` | 任意唯一字符串 | 任务唯一标识，缺失则自动生成 |
| `priority` | `P0` / `P1` / `P2` | 优先级，P0 最高 |
| `category` | `blocker` / `content` / `engineering` / `future` | 分类，影响排序 |
| `blockedBy` | 逗号分隔的 task:id | 依赖任务，必须全部 done 才能被认领 |

---

## 任务选择算法

1. 若指定 `--task-id=<id>`，直接选择该任务。
2. 否则，若存在 **In Progress** 任务，优先返回该任务（方便继续）。
3. 否则，筛选状态为 **todo** 且依赖已满足的任务。
4. 排序：优先级 `P0 > P1 > P2`，同优先级下 `blocker > content > engineering > future`。

---

## 工作模式

### 半自主模式（默认）

`pnpm agent:next` 会：
- 把选中的任务标记为 `In Progress`
- 在 `memory/daily/YYYY-MM-DD.md` 追加开始记录
- 在终端输出完整 prompt

Agent 复制该 prompt 后即可开始实施。代码修改、测试、记忆更新仍由 Agent 在会话中完成。

### 自动执行模式

`pnpm agent:run` 会尝试调用本地 `kimi -p <prompt>` 子进程。为防止误操作：
- 必须设置环境变量 `KIMI_AUTO_RUN=1`
- 子进程退出后不会自动把任务标记为 Done，需人工检查结果

---

## 与 AGENT_WORKFLOW.md 的关系

本脚本是对 `doc/AGENT_WORKFLOW.md` 的自动化补充：

- `doc/AGENT_WORKFLOW.md` 规定“状态优先于扫描、结束即更新”等原则。
- `scripts/agent-task-runner.ts` 把这些原则落地为可运行的工具，减少新会话的启动成本。

建议每次新会话先运行 `pnpm agent:next`，再按 prompt 执行。

---

## 维护

- 新增任务时直接编辑 `memory/BACKLOG.md`，按格式添加元数据即可。
- 任务完成后由 Agent 手动将其移到 **Done** 区，并更新 `memory/STATUS.md` 与当日笔记。
- 如需调整选择算法，修改 `scripts/agent-task-runner.ts` 中的 `pickNextTask`。
