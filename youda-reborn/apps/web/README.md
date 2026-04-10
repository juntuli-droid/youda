# `apps/web`

`apps/web` 是当前项目的主应用，也是默认生产部署入口。

它同时承载：

- Next.js App Router 页面
- 认证、资料、Vlog、徽章等 Route Handlers
- 与 Prisma、Redis、SendGrid、Sentry 的集成
- `public/game-assets` 下的运行时静态资源

## 本地运行

```bash
pnpm --filter web dev
```

默认地址：`http://localhost:3000`

## 当前后端边界

当前生产主链路以 `apps/web/src/app/api/*` 为准。

- 页面直接调用同源 Route Handlers
- `apps/api` 是伴随服务，不是默认线上入口

这样做的好处是：

- 部署更简单，先保证主产品闭环
- 后续若要拆分服务，可以逐步把 Route Handlers 迁移到 `apps/api`

## 关键目录

- `src/app/*`：页面与 Route Handlers
- `src/components/*`：界面组件
- `src/lib/*`：认证、数据库、日志、邮件、限流等基础库
- `public/game-assets/*`：头像与徽章的运行时静态资源
- `docs/openapi.yaml`：当前 Web API 文档

## 开发说明

- 开发环境下，部分环境变量会使用安全占位默认值，便于 lint / build / 本地调试
- Redis 限流在不可用时会降级为 fail-open，避免本地环境被基础设施阻塞
- SendGrid 在开发占位配置下不会真实发信，只会输出日志
