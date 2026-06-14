# OVOKIT 项目状态

> 最后更新：2026-06-14
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
- [x] **迭代 3：5 种核心原型最小 Demo + 嵌入页面 + 详情页回退逻辑**

---

## 进行中（In Progress）

- [ ] **母型与核心原型的映射 + 母型详情页展示**（迭代 2）
  - 文件：`src/lib/archetypes/archetypes.ts`、`src/features/archetypes/pageModel.ts`、`src/components/archetypes/ArchetypePage.tsx`
  - 负责人：Kimi Code CLI
  - 状态：待开始

---

## 待办（Todo）

- [ ] 把核心原型接入详情页 Demo 回退逻辑（✅ 已完成，但保留以确认稳定性）
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
pnpm -s typecheck   # ✅ 通过（2026-06-14）
pnpm -s build       # ✅ 通过（2026-06-14）
pnpm -s lint        # ❌ 115 errors / 1749 warnings（2026-06-14）
git status --short  # ✅ 工作区已清理（2026-06-14）
```

---

## 下一次会话应优先处理

1. 开始实施 `memory/GOALS.md` 中的迭代 2：母型与核心原型的映射 + 母型详情页展示
2. 或修复 Lint errors 中的 block-editor bug
