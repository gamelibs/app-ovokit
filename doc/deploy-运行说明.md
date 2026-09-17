# GamesLog 部署运行说明（deploy.sh）

> 适用：gameslog.top 生产服务器。模式 = **产物分支部署**（`deploy/gameslog.top` 分支为纯构建产物，服务器免构建）。
> 本文件由 2026-09-17 服务器启动故障排查沉淀，随部署链路变化同步更新。

## 一、日常更新（开发机 → 服务器）

```bash
# 开发机（Mac）：构建 + 发布产物分支
bash scripts/release.sh          # 构建 standalone → 提交 deploy/gameslog.top → 重启本地 :19600
git push origin deploy/gameslog.top
git push origin main             # 触发 GitHub Actions（若 secrets 配置正确）

# 服务器：拉取并启动
cd /var/www/gameslog
bash deploy.sh deploy            # update(拉取) → check(环境) → start(reload+健康验证)
```

## 二、deploy.sh 子命令

| 命令 | 作用 |
|---|---|
| `deploy` | 全流程：update → check → start（check 失败中止，不带病上线） |
| `update` | 只 `git pull --ff-only` 拉取产物 |
| `check` | 只跑环境/配置检查 |
| `start` | 未运行则 `pm2 start`，已运行则 `pm2 reload`（零停机）+ 健康验证 |
| `stop` | `pm2 stop gameslog-web` |
| `restart` | `pm2 reload` + 健康验证 |
| `status` | PM2 进程摘要 + 端口监听 + 首页 HTTP 状态 |
| `version` | 当前产物 commit + 上次部署信息（.deploy-meta） |

## 三、「无法启动」排查表（按报错关键词对号入座）

| 报错关键词 | 原因 | 修复 |
|---|---|---|
| `但其工作目录是 xxx，不是当前目录` | PM2 里旧的 `gameslog-web` 属于其它目录（改名/迁移残留），脚本拒绝误操作 | `pm2 delete gameslog-web` 后重跑 |
| `端口 13100 已被占用` | 旧进程未走 PM2 或残留 node 进程 | `ss -tlnp \| grep :13100` 定位后 kill |
| `缺少 .env.local` / `权限` / `NEXT_PUBLIC_SITE_URL 未配置为 https 真实域名` / `MOD_PASSWORD` | check 阶段拦截 | `cp .env.example .env.local` 填真实值 + `chmod 600 .env.local` |
| `git pull --ff-only 失败` | 服务器工作区历史分叉（有人在服务器上 commit 过） | `git status` 确认后 `git reset --hard origin/deploy/gameslog.top` |
| `健康检查失败：30 秒内未返回 200` | 进程起来但崩溃 | `pm2 logs gameslog-web --lines 50 --nostream` 看真实错误 |

## 四、分支防呆（2026-09-17 新增）

服务器克隆**必须是 deploy 分支**，否则拉的是源码、找不到 standalone `server.js` 起不来：

```bash
cd /var/www/gameslog
git rev-parse --abbrev-ref HEAD      # 必须输出 deploy/gameslog.top
# 若不是：
git fetch origin && git checkout deploy/gameslog.top && git pull --ff-only
```

## 五、Cloudflare 缓存

gameslog.top 套了 Cloudflare 代理。部署成功但页面没变化时，在 CF 控制台 **Caching → Purge Everything**（或按 URL 精确清除 `/`、`/play/*`）。

## 六、GitHub Actions 自动链路（当前状态）

`.github/workflows/deploy.yml`：push `main` → SSH 到服务器拉取构建。依赖 secrets：`DEPLOY_HOST`（**必须是源站真实 IP，不能是 Cloudflare 域名/边缘 IP**）、`DEPLOY_USER`、`DEPLOY_SSH_KEY`、`DEPLOY_PATH`、`DEPLOY_PORT`。
2026-09 实测该链路 SSH 步骤失败（疑为 DEPLOY_HOST 指向 CF 地址或源站 IP 变更），修复前请用本文档手动路径。
