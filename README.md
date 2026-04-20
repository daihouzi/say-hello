# say-hello

这是一个用于 **自动触发 `@codex` 轻量任务** 的最小示例仓库。

仓库目前提供两种能力：

1. **GitHub Actions 定时触发**：每天自动创建一条包含 `@codex` 的 Issue。
2. **Node 脚本评论触发**：在指定（或自动解析的）Issue 下发布 `@codex` 评论。

## 仓库结构

- `.github/workflows/daily-codex-ping.yml`：定时工作流（每天 UTC 00:00，约北京时间 08:00）。
- `.github/scripts/daily-codex-ping.js`：评论正文生成、目标 Issue 解析、评论发布逻辑。
- `tests/daily-codex-ping.test.js`：脚本的基础单元测试。

## 工作流模式（每天创建 Issue）

工作流会按 Cron 定时执行，并创建标题格式为 `[Codex Auto Ping] YYYY-MM-DD` 的 Issue，正文中包含 `@codex` 提示语。

触发方式：

- 定时触发：每天 UTC 00:00。
- 手动触发：在 GitHub Actions 页面使用 `workflow_dispatch`。

## 脚本模式（在 Issue 下发评论）

脚本支持：

- 生成标准评论正文（含日期 marker + `@codex`）。
- 自动解析目标 Issue：
  - 优先使用传入的 `issueNumber`；
  - 否则查找带 `codex-auto-ping` 标签的开放 Issue；
  - 若仍不存在，则创建一个锚点 Issue。
- 支持 dry-run（只打印将执行的动作，不真正发评论）。

## 本地测试

使用 Node.js 运行测试：

```bash
node tests/daily-codex-ping.test.js
```

预期输出：

```text
All tests passed
```

## 适用场景

- 需要每天自动“唤醒”或触发一次 `@codex` 协作流程。
- 需要一个小体量、可测试、可扩展的自动化示例仓库。

## 维护说明

- 该仓库支持通过 PR 评论触发一次轻量 `@codex` 任务（例如“请执行一次轻量任务，用于触发 token 消耗”）。
