# 资源清单说明（Resource Catalog）

## 1. 人格测评资源

## 1.1 题库文件
- 路径：`assessments/question-bank/personalityQuestions.ts`
- 用途：定义全部测评题目、选项、评分映射、分类标签
- 关键规格：
  - 题型：单选
  - 分类：`style` / `personality` / `preference` / `frequency`
  - 每个选项包含 `label + score`，`score` 为多维人格分值增量
- 使用场景：
  - 人格测评流程题目抽样和题面渲染
  - 结果计算输入数据源

## 1.2 测评逻辑文件
- `assessments/logic/personalityEngine.ts`
  - 用途：题目抽样、得分计算、人格类型判定、标签生成
- `assessments/logic/personalityAvatarResolver.ts`
  - 用途：从得分与人格编码映射角色头像
- `assessments/logic/personalityReport.ts`
  - 用途：报告内容构造与导出辅助逻辑

---

## 2. 角色头像资源（27个角色）
- 索引清单：`avatars/manifest.json`
- 资源目录：
  - `avatars/characters/display/`（展示图）
  - `avatars/characters/avatar/`（头像图）
- 命名规范：
  - `char-XX-<slug>-display.png`
  - `char-XX-<slug>-avatar.png`
- 规格参数：
  - 格式统一：PNG
  - 每项包含：`width`, `height`, `source`, `character`, `slug`
- 使用场景：
  - 人格结果页角色展示
  - 主页头像/角色卡渲染

---

## 3. 奖章徽章资源
- 索引清单：`badges/manifest.json`
- 资源目录：
  - `badges/icons/rank/`（段位徽章）
  - `badges/icons/achievement/`（成就徽章）
- 命名规范：
  - 段位：`badge-rank-<slug>-{active|inactive}.png`
  - 成就：`badge-achievement-XX-{active|inactive}.png`
- 规格参数：
  - 格式统一：PNG
  - active/inactive 双态齐备
  - 每项包含：`group`, `slug`, `width`, `height`, `source`
- 使用场景：
  - 个人主页奖章墙
  - 自动奖章（生涯段位）与官方成就徽章展示

---

## 4. 统一调用入口
- 顶层索引：`inventory/assets-manifest.json`
- 版本信息：`VERSION.json`
- 变更记录：`CHANGELOG.md`

---

## 5. 更新维护规范
- 新增资源必须遵循命名规范和目录分层
- 更新资源后同步更新 manifest
- 提交前执行完整性校验脚本：
  - `node resources/game-assets/scripts/verify-resource-pack.mjs`
