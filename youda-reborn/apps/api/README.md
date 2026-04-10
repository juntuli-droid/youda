# `apps/api`

这是一个 NestJS 形式的伴随服务，主要用于：

- 承载可独立演进的 REST 接口原型
- 复用 `@youda/game-assets` 中的人格题库与结果计算逻辑
- 为未来将 Web Route Handler 抽离成独立后端保留演进空间

## 当前定位

- 生产主后端入口：`apps/web/src/app/api/*`
- `apps/api`：伴随服务，不是当前默认部署入口

换句话说，现在真正为前端页面提供认证、资料和内容写入能力的，是 Web 应用内的 Route Handlers；Nest 服务保留用于接口分层演进和独立部署实验。

## 本地运行

```bash
pnpm --filter api dev
```

Swagger 文档默认在 `http://localhost:3001/api/docs`。

## 测试

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```

## 目录说明

- `src/auth/*`：认证相关占位模块
- `src/question/*`：人格题库读取接口
- `src/result/*`：人格结果计算接口

## 后续建议

如果未来决定正式把后端独立出去，建议优先迁移：

1. `apps/web/src/app/api/auth/*`
2. `apps/web/src/app/api/users/me/*`
3. 与 Prisma / Redis / 邮件相关的安全链路
