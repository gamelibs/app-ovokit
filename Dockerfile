# syntax=docker/dockerfile:1

# OVOFORGE 生产容器镜像
# 包含 Next.js 前端构建产物与 Fastify 算法 Demo 后端运行时

FROM node:20-slim AS base

# 安装构建/运行可能需要的系统依赖（sharp、git、curl 健康检查等）
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 make g++ git ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# 安装固定大版本 pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# --- 依赖层 ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- 构建层 ---
FROM deps AS builder
COPY . .

# NEXT_PUBLIC_* 必须在构建时注入，会被打包到客户端 bundle 中
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_GA_ID

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_CONTACT_EMAIL=${NEXT_PUBLIC_CONTACT_EMAIL}
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# --- 运行层 ---
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# 只复制运行所需文件；.env.local 在运行时通过卷挂载注入，不会进入镜像
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY --from=builder /app/games ./games
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/server ./server
COPY --from=builder /app/ecosystem.web.config.js ./ecosystem.web.config.js
COPY --from=builder /app/ecosystem.algo.config.js ./ecosystem.algo.config.js
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 13100 14100

CMD ["pnpm", "start"]
