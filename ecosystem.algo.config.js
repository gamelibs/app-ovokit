module.exports = {
  apps: [
    {
      name: "ovoforge-algo-api",
      script: "pnpm",
      args: "algo:start",
      interpreter: "bash",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        ALGO_PORT: process.env.ALGO_PORT || 14100,
        ALGO_HOST: process.env.ALGO_HOST || "0.0.0.0",
      },
    },
  ],
};
