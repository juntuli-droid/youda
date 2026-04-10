# 认证系统 SLA 与监控手册

## 1. SLA 目标

- 认证服务可用性：`>= 99.9%`
- 登录接口平均响应时间：`<= 200ms`
- 注册接口平均响应时间：`<= 300ms`
- Refresh Token 轮换成功率：`>= 99.95%`

## 2. 已落地能力

- JWT Access Token + Refresh Token 双令牌
- Refresh Token 轮换与主动吊销
- 异地登录挑战验证
- IP / 账号双维度限流
- 登录会话与设备指纹审计

核心文件：

- [login/route.ts](/Users/lijuntu/Desktop/youda/youda-reborn/apps/web/src/app/api/auth/login/route.ts)
- [refresh/route.ts](/Users/lijuntu/Desktop/youda/youda-reborn/apps/web/src/app/api/auth/refresh/route.ts)
- [logout/route.ts](/Users/lijuntu/Desktop/youda/youda-reborn/apps/web/src/app/api/auth/logout/route.ts)
- [session-service.ts](/Users/lijuntu/Desktop/youda/youda-reborn/apps/web/src/lib/session-service.ts)

## 3. 核心监控指标

| 指标 | 说明 | 告警阈值 |
|---|---|---|
| 登录成功率 | `登录成功 / 登录总请求` | `< 98%` |
| 注册成功率 | `注册成功 / 注册总请求` | `< 98%` |
| Token 刷新成功率 | `刷新成功 / 刷新总请求` | `< 99%` |
| 登录 P99 | 登录接口 99 分位耗时 | `> 2s` |
| 注册 P99 | 注册接口 99 分位耗时 | `> 2s` |
| Redis 限流错误率 | Redis 不可用导致 fail-open 的比率 | `> 1%` |
| 登录挑战触发率 | 新环境验证占比 | 异常波动时告警 |

## 4. 多端登录与强制登出

- 当前会话登出：吊销当前 `refreshToken` 并标记 `loginSession.revokedAt`
- 全端强制登出：
  - 调用 `revokeAllRefreshTokensForUser`
  - 调用 `revokeLoginSessionsForUser`
- 异地登录时：
  - 吊销旧会话
  - 创建 `PENDING_REVERIFY` 会话
  - 发送挑战邮件

## 5. 外部认证故障转移策略

当前仓库未接入 OAuth2 / SAML，但生产设计建议如下：

- 第三方认证不可用时自动回退到邮箱密码登录
- 第三方认证回调超时后提示用户重试，不锁死本地账号
- 外部 IdP 故障期间暂停自动绑定，避免脏映射

## 6. 压测建议

- 登录：100 / 300 / 500 RPS 阶梯压测
- 注册：关注数据库写入和 SendGrid 发送链路
- 刷新：重点观察 Redis、DB 会话表和 Token 轮换
