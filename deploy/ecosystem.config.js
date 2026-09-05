// GamesLog 产物模式 PM2 配置（deploy/gameslog.top 分支根）
// standalone 产物自带 server.js 与最小 node_modules，直接 node 运行，无需 pnpm。
module.exports = {
  apps: [
    {
      name: "ovoforge-web",
      script: "server.js",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 13100,
      },
    },
  ],
};
