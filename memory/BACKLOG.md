# OVOKIT 任务看板

> 本文件记录当前阶段任务状态。每次会话开始前/结束后更新。
> 当前阶段目标见 `memory/GOALS.md`。

---

## In Progress

- [ ] **新增 5 种核心玩法原型数据层与筛选**
  - 目标：让用户能按核心原型筛选，让版主发帖能选原型
  - 文件：`src/lib/patterns/patterns.ts`、`src/lib/content/plays.ts`、首页筛选、`NewPlayForm`、mod API
  - 负责人：Kimi Code CLI
  - 开始时间：2026-06-14
  - 阻塞：git 工作区 35 个未提交文件待处理

---

## Todo

### 核心原型架构

- [ ] 建立母型与核心原型的映射（`archetypeToPatterns`）
- [ ] 母型详情页展示所属核心原型
- [ ] 为 5 种核心原型各实现一个最小服务端 Demo
- [ ] 为 5 种核心原型各新增嵌入页面与 Viewer
- [ ] 把核心原型 Demo 接入详情页回退逻辑
- [ ] 版主表单：选择原型后自动生成 breakdown/code 骨架
- [ ] AI 分析工具识别并输出 `pattern` 字段

### 工程化

- [ ] 处理 git 工作区 35 个未提交文件（commit / discard / 拆分）
- [ ] 修复 `useBlockEditor.ts` 中 `commit` 提前访问 bug
- [ ] 分批治理 Lint errors（优先 errors）
- [ ] 考虑把统计持久化从文件系统迁到 Redis/DB

### 体验

- [ ] 补齐真实封面图与母型说明图（可选，内部运行可用占位图）
- [ ] 优化联系表单通知（邮件/webhook）
- [ ] 完善搜索高亮与空状态

---

## Done

- [x] 建立 Agent 工作流记忆系统（`memory/`、`doc/AGENT_WORKFLOW.md`）
- [x] 手绘风格化基本完成
- [x] 30 篇玩法内容填充
- [x] 12 种母型文案填充
- [x] 三消 Demo 可玩
- [x] 12 个母型 Demo 可玩
- [x] 版主登录/发帖/编辑/发布/删除流程
- [x] AI 分析/封面/流程图/示意图工具
- [x] `pnpm typecheck` / `pnpm build` 通过

---

## 归档规则

完成的任务从 **In Progress / Todo** 移到 **Done**，保留 2-4 周；超过一个月的 Done 项可删除或移入 `memory/archive/BACKLOG-YYYY-MM.md`。
