# Serverless 连接与基准验证

## 1. 目标

- 冷启动数据库建连耗时不超过 `1500ms`
- Web Serverless 实例在高并发下不因重复建连耗尽连接池
- Prisma 迁移、seed 与运行态读写连接分离

## 2. 环境变量约定

- `DATABASE_URL`：应用运行态连接串，应指向连接池或代理入口
- `DIRECT_DATABASE_URL`：Prisma 迁移、回滚、seed 使用的直连串

## 3. 运行时策略

1. `@youda/database` 中的 `PrismaClient` 使用全局单例缓存，避免热实例重复初始化。
2. `warmDatabaseConnection()` 启动时执行 `SELECT 1`，提前完成连接握手。
3. Serverless 基准脚本会输出 `coldStartMs`，超过 `1500ms` 时直接返回非零退出码。

## 4. 验证命令

```bash
pnpm --filter @youda/database benchmark:serverless
```

输出示例：

```json
{
  "event": "database.cold-start.benchmark",
  "targetMs": 1500,
  "coldStartMs": 842.13
}
```

## 5. 建议的上线验收步骤

1. 在 staging 环境注入真实 `DATABASE_URL` 与 `DIRECT_DATABASE_URL`
2. 执行 `pnpm --filter @youda/database migrate:deploy`
3. 执行 `pnpm --filter @youda/database benchmark:serverless`
4. 通过压测工具验证注册、登录、资料读取三个主接口
5. 观察数据库活跃连接数、P99 查询耗时和错误率 15 分钟以上

## 6. 当前仓库内可验证范围

- 已提供 Prisma 单例、迁移目录、初始化 SQL、回滚 SQL、冷启动基准脚本
- 需要真实云数据库账号后，才能产出正式 Serverless 冷启动截图和基准数值
