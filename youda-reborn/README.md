# 有搭 `youda-reborn`

有搭是一个面向游戏玩家的“人格测评 + 搭子匹配 + 主页沉淀”项目。

当前仓库已经包含：

- 主 Web 应用：`apps/web`
- 伴随 Nest 服务：`apps/api`
- 数据库层：`packages/database`
- 测评与资源清单层：`packages/game-assets`

## 当前架构结论

当前默认生产入口是 `apps/web`。

也就是说：

- 页面由 Next.js App Router 提供
- 认证、资料、密码重置、徽章、生涯、Vlog 等接口由 `apps/web/src/app/api/*` 提供
- `apps/api` 作为伴随服务保留，用于接口独立化演进，不是当前唯一真源

这样可以先保证产品闭环，再决定是否拆成独立前后端。

## Monorepo 结构

```text
apps/
  web/        主应用与主后端入口
  api/        伴随 NestJS 服务
packages/
  database/   Prisma schema、SQL、seed
  game-assets/人格题库、资源 manifest、资源校验
deployments/  Docker / Kubernetes 示例
```

## 本地开发

```bash
pnpm install
pnpm --filter web dev
pnpm --filter api dev
```

## 运行前需要知道的事

- Web 应用在开发环境下提供了安全占位环境变量，便于 lint / build / UI 调试
- 真正接数据库、Redis、邮件、监控时，仍应提供正式环境变量
- `packages/game-assets` 维护逻辑与资源清单，Web 实际发布资源位于 `apps/web/public/game-assets`

## 常用验证

```bash
pnpm --filter web lint
pnpm --filter api test
node packages/game-assets/scripts/verify-resource-pack.mjs
```

## 当前优先级建议

如果继续演进，建议优先按下面顺序做：

1. 补齐 Route Handlers 的测试
2. 明确 `apps/api` 是否正式接管生产后端
3. 统一 Prisma migration、SQL 初始化脚本和部署环境
4. 把徽章、角色、人格结果更多地下沉到共享配置层
