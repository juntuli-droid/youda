# 游戏资源管理中心（Resource Pack）

该目录是项目的统一资源清单与逻辑入口，面向前端重构与跨框架迁移使用。
当前约定如下：

- `packages/game-assets/` 负责维护测评逻辑、资源 manifest、索引与校验脚本
- `apps/web/public/game-assets/` 负责承载 Web 运行时实际访问到的静态资源
- 校验脚本会同时检查 package 侧 manifest 与 Web public 侧发布副本是否一致

## 目录结构

- `assessments/`
  - `question-bank/`：人格测评题库源文件
  - `logic/`：测评逻辑、人格判定与报告生成逻辑
- `avatars/`
  - `characters/display/`：27个角色展示图（标准命名）
  - `characters/avatar/`：27个角色头像图（标准命名）
  - `manifest.json`：角色资源清单（尺寸、来源、映射）
- `badges/`
  - `icons/rank/`：段位徽章（active/inactive）
  - `icons/achievement/`：成就徽章（active/inactive）
  - `manifest.json`：徽章清单（尺寸、来源、类型）
- `inventory/`
  - `assets-manifest.json`：总清单索引
  - `path-index.json`：按角色/徽章名称的快速定位索引
  - `RESOURCE_CATALOG.md`：用途、规格、场景文档
- `scripts/`
  - `verify-resource-pack.mjs`：资源完整性校验脚本
- `VERSION.json`：资源包版本信息
- `CHANGELOG.md`：资源变更记录

## 标准命名规范

- 角色图：
  - `char-XX-<slug>-display.png`
  - `char-XX-<slug>-avatar.png`
- 徽章图：
  - `badge-rank-<slug>-active.png`
  - `badge-rank-<slug>-inactive.png`
  - `badge-achievement-XX-active.png`
  - `badge-achievement-XX-inactive.png`

## 版本控制机制

- 版本源：`VERSION.json`
  - `resourcePackVersion`：资源包发布版本
  - `schemaVersion`：清单结构版本
- 变更记录：`CHANGELOG.md`
- 发布流程建议：
  1. 新增/替换资源
  2. 更新 `avatars/manifest.json` 与 `badges/manifest.json`
  3. 执行 `node packages/game-assets/scripts/verify-resource-pack.mjs`
  4. 更新 `VERSION.json` 和 `CHANGELOG.md`

## 调用建议

- 程序调用优先读取 `avatars/manifest.json` 和 `badges/manifest.json`
- Web 运行时通过 `/game-assets/**` 访问 `apps/web/public/game-assets/` 下的发布资源
- 业务逻辑引用 `inventory/assets-manifest.json` 作为统一入口
