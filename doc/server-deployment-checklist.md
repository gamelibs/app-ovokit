# OVOFROGE 服务器部署清单

> 目标：将 OVOFROGE（Next.js 16 + Fastify Demo 后端）部署到生产服务器（CentOS / RHEL / Rocky Linux）。
> 配套脚本：`scripts/deploy-check.sh`（拉取代码后运行，检查环境、配置、安全）。
> 配套 CI/CD：`.github/workflows/deploy.yml`（push 到 `main` 后自动部署）。

---

## 一、部署架构建议

### 不推荐：维护一个独立的 `server` 分支

之前你提到“在当前分支再创建一个 `server` 分支，只保存服务端的站点内容”。这种方案在上线初期看似清爽，但长期会带来以下问题：

| 问题 | 说明 |
|---|---|
| 版本漂移 | `server` 分支容易忘记同步，导致线上代码与开发主线不一致。 |
| 合并冲突 | 每次合并都要处理两份代码树的差异，徒增心智负担。 |
| 构建依赖 | Next.js 生产包依赖 `package.json`、`pnpm-lock.yaml`、源码构建产物，单纯“服务端内容”往往不完整。 |
| 回滚困难 | 出问题时要同时回滚主分支和 server 分支，容易遗漏。 |
| 审计困难 | 无法直接通过 `git log` 看出线上运行的是哪个 commit。 |

### 推荐方案：`main` 单源 truth + CI/CD 自动部署

1. **以 `main` 分支为唯一上线源**，不再维护精简分支。
2. **服务器保留完整仓库**（包括源码、脚本、PM2 配置），在服务器本地执行 `pnpm install` + `pnpm build`。
3. **使用 GitHub Actions** 在 `main` 分支更新后自动 SSH 到服务器执行：拉取 → 检查 → 安装 → 构建 → 重启。
4. 如果未来想减少服务器上的源码，可改为**构建产物部署**（rsync `.next/standalone` + `server/` + `public/`），而不是维护一个长期分支。

---

## 二、服务器环境要求

| 项目 | 要求 | 备注 |
|---|---|---|
| OS | CentOS 7/8、Rocky Linux 8/9、RHEL 8/9 | 脚本已适配 `firewalld` 与 `dnf`/`yum` |
| CPU / 内存 | 2 核 / 4 GB 起 | Next.js build 峰值内存约 1.5–3 GB |
| 磁盘 | 20 GB+ | 日志与 `node_modules` 会持续增长 |
| Node.js | >= 20.0.0 | 推荐通过 NodeSource 或 `fnm` 安装 |
| pnpm | >= 9.0.0 | `npm install -g pnpm` |
| Git | >= 2.20 | 用于拉取代码 |
| PM2 | 全局安装 | `pnpm add -g pm2` 或 `npm i -g pm2` |
| Nginx | 反向代理 + SSL | `dnf install nginx` |
| Redis | Upstash Redis（托管） | 生产环境必须配置，文件 fallback 仅用于开发 |
| 域名 + SSL | 必须 | Let's Encrypt / 自有证书 |

---

## 三、服务器初始化（一次性）

### 3.1 创建专用用户

```bash
# 不要在 root 下运行 Node 应用
sudo useradd -m -s /bin/bash ovofroge
sudo usermod -aG wheel ovofroge
sudo su - ovofroge
```

### 3.2 安装 Node.js 与 pnpm

```bash
# 方式 A：NodeSource（CentOS/RHEL）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 方式 B：fnm（推荐，方便多版本）
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm install 20
fnm use 20

# 安装 pnpm
npm install -g pnpm@9
```

### 3.3 安装系统依赖

```bash
sudo dnf install -y git nginx firewalld curl ca-certificates
sudo systemctl enable --now firewalld
sudo systemctl enable --now nginx

# 安装 certbot（Let's Encrypt）
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx
```

### 3.4 安装 PM2

```bash
sudo npm install -g pm2
# 或
pnpm add -g pm2
```

### 3.5 配置防火墙

```bash
# 仅暴露 HTTP/HTTPS/SSH
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 明确拒绝外部直接访问应用端口（只让 Nginx 反向代理访问本地端口）
sudo firewall-cmd --permanent --remove-port=13100/tcp || true
sudo firewall-cmd --permanent --remove-port=14100/tcp || true
sudo firewall-cmd --reload
```

---

## 四、应用部署

### 4.1 服务器目录结构

```
/var/www/ovofroge/
├── .env.local          # 生产环境变量（600 权限）
├── .git/
├── .next/              # 构建产物
├── ecosystem.web.config.js
├── ecosystem.algo.config.js
├── node_modules/
├── package.json
├── pnpm-lock.yaml
├── public/
├── scripts/
│   └── deploy-check.sh
├── server/             # Fastify Demo 后端
└── src/
```

### 4.2 首次拉取代码

```bash
sudo mkdir -p /var/www/ovofroge
sudo chown -R ovofroge:ovofroge /var/www/ovofroge
sudo su - ovofroge
cd /var/www/ovofroge
git clone git@github.com:<你的仓库>.git .
```

> 建议为服务器生成专用 Deploy Key，并在 GitHub 仓库 Settings → Deploy keys 中添加（只读权限即可）。

### 4.3 配置环境变量

复制示例文件并编辑：

```bash
cp .env.example .env.local
chmod 600 .env.local
nano .env.local
```

生产环境至少填写以下变量：

```bash
NEXT_PUBLIC_SITE_URL=https://ovoforge.com
NEXT_PUBLIC_CONTACT_EMAIL=your@email.com
MOD_PASSWORD=<随机强密码，至少 16 位>
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX        # 可选
```

### 4.4 运行部署前检查

```bash
bash scripts/deploy-check.sh
```

若输出为 **✅ 通过**，再继续下一步。若有 **❌ 失败项**，请先修复。

### 4.5 安装依赖并构建

```bash
pnpm install --frozen-lockfile
pnpm build
```

> 构建时若内存不足，可设置：
> ```bash
> NODE_OPTIONS=--max-old-space-size=4096 pnpm build
> ```

### 4.6 启动服务（PM2）

```bash
# 前端
pnpm web:pm2

# 算法 Demo 后端
pnpm algo:pm2

# 保存 PM2 进程列表，开机自启
pm2 save
sudo env PATH=$PATH:$(dirname $(which node)) pm2 startup systemd -u ovofroge --hp /home/ovofroge
```

### 4.7 Nginx 反向代理配置

创建 `/etc/nginx/conf.d/ovofroge.conf`：

```nginx
server {
    listen 80;
    server_name ovoforge.com www.ovoforge.com;

    # 禁止访问 .git 目录
    location ~ /\.git {
        deny all;
        return 404;
    }

    # 静态资源缓存（可选）
    location /_next/static/ {
        proxy_pass http://127.0.0.1:13100;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # 所有流量转发到 Next.js
    location / {
        proxy_pass http://127.0.0.1:13100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

测试并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4.8 SSL 证书（Let's Encrypt）

```bash
sudo certbot --nginx -d ovoforge.com -d www.ovoforge.com
```

证书会自动续期，可通过 `sudo certbot renew --dry-run` 测试。

---

## 五、安全加固

| 项目 | 操作 |
|---|---|
| 禁止 root 运行应用 | 使用 `ovofroge` 用户运行 PM2 进程 |
| 环境变量文件权限 | `chmod 600 /var/www/ovofroge/.env.local` |
| 禁止外部访问 13100/14100 | 仅通过 Nginx 80/443 暴露；防火墙不开放应用端口 |
| 禁止访问 `.git` | Nginx 配置 `location ~ /\.git { deny all; }` |
| 版主密码强度 | 使用 `openssl rand -hex 32` 生成，不要复用开发密码 |
| HSTS | `next.config.ts` 已根据 `NEXT_PUBLIC_SITE_URL` 自动启用（生产 HTTPS） |
|  fail2ban（可选） | 安装并启用 SSH/HTTP 暴力破解防护 |
| 自动更新（可选） | 启用 `dnf-automatic` 安全更新 |

---

## 六、GitHub Actions 自动部署

仓库已包含 `.github/workflows/deploy.yml`。配置步骤：

1. 在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：
   - `DEPLOY_HOST`：服务器 IP 或域名
   - `DEPLOY_USER`：`ovofroge`
   - `DEPLOY_SSH_KEY`：服务器私钥（建议单独生成 deploy key）
   - `DEPLOY_PATH`：`/var/www/ovofroge`
2. 确保服务器已配置好 `.env.local` 和 Nginx。
3. 每次 push 到 `main`，GitHub Actions 会：
   - SSH 到服务器
   - `git pull origin main`
   - 运行 `scripts/deploy-check.sh`
   - `pnpm install --frozen-lockfile`
   - `pnpm build`
   - PM2 reload web + algo

---

## 七、部署后验证

```bash
# 1. 服务状态
pm2 status

# 2. 端口监听
ss -tlnp | grep -E '13100|14100'

# 3. 首页访问
curl -I https://ovoforge.com/

# 4. 算法后端健康检查（应只能从服务器本地访问）
curl http://127.0.0.1:14100/health

# 5. 版主登录与统计点赞是否正常
# 6. 联系表单提交是否正常
```

---

## 八、回滚方案

```bash
sudo su - ovofroge
cd /var/www/ovofroge

# 回滚到上一个稳定 commit
git log --oneline -5
git checkout <稳定 commit>
pnpm install --frozen-lockfile
pnpm build
pm2 reload ecosystem.web.config.js
pm2 reload ecosystem.algo.config.js
```

---

## 九、日常运维

| 操作 | 命令 |
|---|---|
| 查看日志 | `pm2 logs ovofroge-web` / `pm2 logs ovofroge-algo-api` |
| 重启服务 | `pm2 reload ovofroge-web` / `pm2 reload ovofroge-algo-api` |
| 监控 | `pm2 monit` |
| 检查 SSL 到期 | `sudo certbot renew --dry-run` |
| 更新依赖 | 先在本地测试，再 push 到 `main` 触发自动部署 |

---

## 十、常见问题

**Q：能不能把 `.env.local` 也放进 GitHub Actions  secrets 然后每次写入服务器？**  
A：可以，但不推荐。这样会让密钥在 CI 日志和服务器文件系统两处留存，增加泄露面。更安全的做法是：一次性在服务器写入 `.env.local` 并 `chmod 600`，CI 只负责拉取代码和重启。

**Q：能否只部署构建产物，不保留服务器上的源码？**  
A：可以。CI 在 runner 上 `pnpm build` 后，通过 `rsync` 把 `.next/standalone`、`public`、`server`、`ecosystem.*.config.js`、`package.json`、`pnpm-lock.yaml` 同步到服务器。这种方式适合大流量场景，但当前 P0 用完整仓库部署更直观。

**Q：服务器上 Node 版本升级怎么办？**  
A：使用 `fnm` 管理多版本，升级后重新 `pnpm install && pnpm build && pm2 reload all`。
