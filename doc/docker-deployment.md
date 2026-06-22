# OVOFORGE Docker 生产部署指南

适用于服务器系统较旧、想用容器隔离环境的场景。镜像基于官方 `node:20-slim`，前后端共用一份镜像，通过 `docker-compose.yml` 分别启动 `web` 与 `algo` 容器。

---

## 架构

```
用户 → Nginx (80/443) → 127.0.0.1:13100 → ovoforge-web 容器
                                    ↓
                           127.0.0.1:14100 → ovoforge-algo 容器（本地-only）
```

- 应用端口 **13100/14100 只绑定到宿主机回环**，不直接暴露到公网。
- SSL、域名、静态资源缓存由宿主机 Nginx 负责。
- `.env.local` 通过 `env_file` 在运行时挂载，**不会被打包进镜像**。
- `NEXT_PUBLIC_*` 变量在构建时通过 `args` 注入，确保客户端 bundle 正确。

---

## 服务器要求

| 项目 | 要求 |
|------|------|
| Docker | >= 24.0 |
| Docker Compose | >= 2.20 |
| 内存 | >= 4 GB（构建峰值约 2–3 GB） |
| 磁盘 | >= 10 GB 可用空间 |
| Nginx | 宿主机已安装，用于反向代理 + SSL |

---

## 首次部署

### 1. 安装 Docker（如果还没有）

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# CentOS / Rocky
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
```

### 2. 克隆代码

```bash
sudo mkdir -p /var/www/ovoforge
sudo chown -R $USER:$USER /var/www/ovoforge
cd /www/ovoforge
git clone git@github.com:<你的仓库>.git .
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
chmod 600 .env.local
nano .env.local
```

至少填写：

```bash
NEXT_PUBLIC_SITE_URL=https://ovoforge.com
NEXT_PUBLIC_CONTACT_EMAIL=your@email.com
MOD_PASSWORD=<强随机密码，至少 16 位>
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX        # 可选
MOONSHOT_API_KEY=your_key             # 可选，版主 AI 工具需要
```

### 4. 构建并启动容器

```bash
# --env-file .env.local 让 docker-compose 在构建时能读取 NEXT_PUBLIC_* 变量
docker compose --env-file .env.local up --build -d
```

首次构建会比较慢（需要下载 Node 镜像并安装依赖），后续增量构建会快很多。

### 5. 配置 Nginx

编辑 `/etc/nginx/conf.d/ovoforge.com.conf`：

```nginx
server {
    listen 80;
    server_name ovoforge.com www.ovoforge.com;

    # 禁止访问 .git
    location ~ /\.git {
        deny all;
        return 404;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:13100;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # 全部流量转到 Next.js 容器
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

### 6. 配置 SSL

```bash
sudo certbot --nginx -d ovoforge.com -d www.ovoforge.com
```

如果已经配好证书，certbot 会自动修改 Nginx 配置。

---

## 验证

```bash
# 容器状态
docker compose ps

# 日志
docker compose logs -f

# 本地访问前端
curl -I http://127.0.0.1:13100/

# 算法后端健康检查
curl http://127.0.0.1:14100/health

# 公网访问
curl -I https://ovoforge.com/
```

---

## 日常更新

```bash
cd /www/ovoforge

# 拉最新代码
git pull origin main

# 重新构建并启动（会复用缓存层）
docker compose --env-file .env.local up --build -d

# 清理旧镜像（可选）
docker image prune -f
```

---

## 常用命令

| 操作 | 命令 |
|------|------|
| 查看日志 | `docker compose logs -f` |
| 只看 web 日志 | `docker compose logs -f ovoforge-web` |
| 重启 web | `docker compose restart ovoforge-web` |
| 进入 web 容器 | `docker compose exec ovoforge-web bash` |
| 停止所有服务 | `docker compose down` |
| 查看容器资源占用 | `docker stats` |

---

## 安全注意

1. **`.env.local` 权限**：`chmod 600 .env.local`，不要把真实密钥提交到 Git。
2. **端口暴露**：`docker-compose.yml` 中 `13100/14100` 只绑定 `127.0.0.1`，确保不会直接暴露到公网。
3. **镜像中不含密钥**：`Dockerfile` 不复制 `.env.local`，只通过 build args 注入 `NEXT_PUBLIC_*` 公开变量。
4. **及时更新基础镜像**：定期 `docker compose build --no-cache` 以获取 Node 安全补丁。

---

## 与 GitHub Actions 自动部署结合

如果你希望 push 到 `main` 后自动部署，可以在 `.github/workflows/deploy.yml` 中把部署脚本改为 Docker 命令：

```yaml
script: |
  set -euo pipefail
  cd /www/ovoforge
  git fetch origin main
  git reset --hard origin/main
  docker compose --env-file .env.local up --build -d
  docker image prune -f
```

---

## 常见问题

**Q：构建时报内存不足？**  
A：确保服务器内存 >= 4GB，或在构建命令前加 `NODE_OPTIONS=--max-old-space-size=4096`：

```bash
NODE_OPTIONS=--max-old-space-size=4096 docker compose up --build -d
```

**Q：不想用 docker-compose，只想跑单个容器？**  
A：可以只跑前端：

```bash
docker build -t ovoforge:latest .
docker run -d --name ovoforge-web \
  --env-file .env.local \
  -p 127.0.0.1:13100:13100 \
  ovoforge:latest
```

**Q：算法后端没有用到，可以不启动吗？**  
A：可以。站点内的 Demo 目前由 Next.js `/api/demos/*` 路由直接处理，`ovoforge-algo` 主要保留给未来扩展和本地健康检查。不需要时可以注释掉 `docker-compose.yml` 中的 `ovoforge-algo` 服务。

日常运维命令
cd /www/ovoforge
# 查看容器状态
docker compose ps

# 查看 web 日志
docker compose logs -f ovoforge-web

# 查看 algo 日志
docker compose logs -f ovoforge-algo

# 重启 web
docker compose restart ovoforge-web

# 更新代码后重新部署
git pull origin main
docker compose --env-file .env.local down
docker compose --env-file .env.local build --no-cache
docker compose --env-file .env.local up -d
docker system prune -f