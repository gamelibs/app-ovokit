OVOKIT: 游戏玩法 + 技术实现 + 可试玩 Demo（MVP）

- 首页：小红书风卡片流
- 详情页：玩法拆解 + 代码 + Demo（iframe 占位）
- 内容源：本地 `content/plays/<slug>/{meta.json,article.mdx}`
- 版主发布：右上角菜单登录后进入 `/mod/new`

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

设置版主口令（可选，用于本地发布）：

```bash
export MOD_PASSWORD="your-password"
```

然后通过右上角菜单进入版主模式。

注：当前默认使用 `--webpack` 运行/构建以避免受限环境下 Turbopack 的问题。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
