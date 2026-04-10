# 数据库 ER 与索引设计

## 1. 选型

- 数据库：MySQL 8.x
- ORM：Prisma
- 字符集：utf8mb4
- 排序规则：utf8mb4_unicode_ci

## 2. ER 关系概览

```text
User
 ├── Career (1:N)
 ├── Vlog (1:N)
 ├── Match (1:N, hosted)
 ├── Friend (1:N, requester)
 ├── Friend (1:N, addressee)
 ├── ChatMessage (1:N, sender)
 ├── ChatMessage (1:N, receiver)
 ├── RefreshToken (1:N)
 ├── PasswordResetToken (1:N)
 └── LoginSession (1:N)

Match
 └── ChatMessage (1:N)

RefreshToken
 └── LoginSession (1:N)
```

## 3. 核心表说明

### 3.1 users

- 存储用户基础信息、认证口令摘要、徽章与扩展资料
- email 与 username 为全局唯一

### 3.2 friends

- 建模用户好友关系与申请状态
- 使用 `(user_id, friend_id)` 唯一键避免重复关系
- `message_retention_policy` 用于控制删除好友时聊天清理策略

### 3.3 matches

- 存储匹配和房间记录
- 通过 `host_user_id` 和 `status` 支撑房间查询与历史记录

### 3.4 chat_messages

- 同时支持私聊消息与房间消息
- `match_id` 非空表示房间消息
- `receiver_id` 非空表示私聊消息

### 3.5 vlogs

- 存储游戏 Vlog 和文本日志
- 支持按用户和游戏维度快速筛选

### 3.6 careers

- 存储用户游戏生涯信息
- 支持按用户和游戏维度查询

## 4. 索引设计

| 表 | 索引 | 用途 |
|---|---|---|
| users | `unique(email)` | 登录、找回密码 |
| users | `unique(username)` | 登录、资料唯一性校验 |
| users | `index(createdAt)` | 新增用户趋势统计 |
| friends | `(userId, status, createdAt)` | 用户好友列表、申请列表 |
| friends | `(friendId, status, createdAt)` | 被申请列表 |
| matches | `(hostUserId, createdAt)` | 用户房间历史 |
| matches | `(status, createdAt)` | 按状态筛选匹配记录 |
| chat_messages | `(senderId, createdAt)` | 发送历史 |
| chat_messages | `(receiverId, createdAt)` | 私聊收件箱 |
| chat_messages | `(matchId, createdAt)` | 房间消息时间线 |
| chat_messages | `(senderId, receiverId, createdAt)` | 双向私聊查询 |
| vlogs | `(userId, createdAt)` | 个人主页 Vlog 流 |
| vlogs | `(gameName, createdAt)` | 按游戏聚合查询 |
| careers | `(userId, createdAt)` | 用户生涯列表 |
| careers | `(gameName, createdAt)` | 游戏热度统计 |
| refresh_tokens | `(userId, expiresAt)` | 会话清理与轮换 |
| refresh_tokens | `(userId, revokedAt)` | 吊销态检查 |
| password_reset_tokens | `(userId, expiresAt)` | 找回密码校验 |
| login_sessions | `(userId, createdAt)` | 登录审计 |
| login_sessions | `(userId, deviceFingerprint)` | 异地登录判断 |

## 5. 级联策略

| 关系 | 删除策略 |
|---|---|
| User -> Career | Cascade |
| User -> Vlog | Cascade |
| User -> Match | Cascade |
| User -> Friend | Cascade |
| User -> RefreshToken | Cascade |
| User -> PasswordResetToken | Cascade |
| User -> LoginSession | Cascade |
| Match -> ChatMessage | SetNull |
| User(receiver) -> ChatMessage | SetNull |

## 6. 生产建议

- 连接池优先通过云数据库代理层或托管连接池处理
- 大表按 `createdAt` 做冷热分层
- 聊天消息建议后续独立读写分离
- Vlog 与 Match 可按业务量评估分库分表
