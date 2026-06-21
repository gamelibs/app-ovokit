module.exports = {
  apps: [
    {
      name: "ovofroge-web",
      script: "pnpm",
      args: "start",
      interpreter: "bash",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 13100,
      },
    },
  ],
};
