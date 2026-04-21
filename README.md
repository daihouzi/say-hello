# say-hello

这是一个用于 **自动触发 `@codex` 轻量任务** 的最小示例仓库。

仓库目前提供两种能力：

1. **GitHub Actions 定时触发（Issue 模式）**：每天自动创建一条包含 `@codex` 的 Issue。
2. **GitHub Actions 定时触发（Comment 模式）**：每天自动在指定（或自动解析的）Issue 下发布 `@codex` 评论。

## 仓库结构

- `.github/workflows/daily-codex-ping.yml`：定时工作流（每天 UTC 00:00，约北京时间 08:00）。
- `.github/scripts/daily-codex-ping.js`：评论正文生成、目标 Issue 解析、评论发布逻辑。
- `.github/workflows/daily-codex-comment.yml`：定时执行脚本，在 Issue 下发布评论。
- `tests/daily-codex-ping.test.js`：脚本的基础单元测试。

## 工作流模式（每天创建 Issue）

工作流会按 Cron 定时执行，并创建标题格式为 `[Codex Auto Ping] YYYY-MM-DD` 的 Issue，正文中包含 `@codex` 提示语。

触发方式：

- 定时触发：每天 UTC 00:00。
- 手动触发：在 GitHub Actions 页面使用 `workflow_dispatch`。

## Comment 工作流模式（在 Issue 下发评论）

`daily-codex-comment.yml` 会定时执行脚本并发评论，默认同时在新建 Issue 和最近活跃 PR（可选）下各发一条 `@codex`。

脚本支持：

- 生成标准评论正文（含日期 marker + `@codex`）。
- 支持触发模式：`issue` / `pr` / `both`（默认 `both`）。
- 自动解析目标 PR：
  - 优先使用传入的 `pull_number`；
  - 否则选择最近更新且非 draft 的开放 PR。
- `both` 模式下会创建新 Issue 并在 Issue + PR 各发一次评论（若存在可用 PR）。
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

## 常见排查

如果你发现“自动任务没有进行”，优先检查：

- 工作流文件是否已经在默认分支（通常是 `main`）上。
- 仓库 Actions 是否启用；若是长期无活动仓库，定时任务可能被 GitHub 自动暂停。
- `Settings -> Actions -> General` 中，`GITHUB_TOKEN` 是否允许工作流写入 Issue。
- 你要触发的是 Issue 还是 Comment：
  - `daily-codex-ping.yml` 会创建新 Issue；
  - `daily-codex-comment.yml` 才会在已有 Issue 下发评论。
