# say-hello

这是一个用于 **自动触发 `@codex` 轻量任务** 的最小示例仓库，适合团队做定时提醒、自动化跟进和最小化运维验证。

仓库提供两种触发模式：

1. **工作流模式（创建 Issue）**：通过 GitHub Actions 每天自动创建一条包含 `@codex` 的 Issue。
2. **脚本模式（Issue 下发评论）**：通过 Node 脚本在指定（或自动解析的）Issue 下发布 `@codex` 评论。

## 仓库结构

- `.github/workflows/daily-codex-ping.yml`：定时工作流（每天 UTC `00:00`，约北京时间 `08:00`）。
- `.github/scripts/daily-codex-ping.js`：评论正文生成、目标 Issue 解析、评论发布逻辑。
- `tests/daily-codex-ping.test.js`：脚本基础单元测试。

## 触发模式一：工作流每天创建 Issue

工作流会按 Cron 定时执行，并创建标题格式为 `[Codex Auto Ping] YYYY-MM-DD` 的 Issue，正文中包含 `@codex` 提示语。

如果你看到工作流里是 `cron: '0 0 * * *'`，这表示 **UTC 00:00** 执行；换算为中国时区（UTC+8）就是每天 **08:00**。

支持两种触发方式：

- **定时触发**：每天 UTC `00:00`。
- **手动触发**：在 GitHub Actions 页面点击 `workflow_dispatch`。

Issue 大致长这样（示例）：

```text
Title: [Codex Auto Ping] 2026-04-20

Body:
自动化触发（每天北京时间 08:00）

@codex 请执行一次轻量任务，用于触发 token 消耗。
```

适用场景：希望每天固定生成一个任务入口，让协作者在 Issue 维度进行跟踪。

## 触发模式二：脚本在 Issue 下发评论

脚本主要能力：

- 生成标准评论正文（含日期 marker + `@codex`）。
- 自动解析目标 Issue：
  - 优先使用传入的 `issueNumber`；
  - 否则查找带 `codex-auto-ping` 标签的开放 Issue；
  - 若仍不存在，则创建一个锚点 Issue。
- 支持 `dry-run`（只打印将执行的动作，不真正发评论）。

适用场景：希望复用已有 Issue 线程，以评论形式持续触发 `@codex`。

## 使用前提

- Node.js（建议 18+）。
- 仓库具备 Issue 读写权限（GitHub Token 需要可创建/评论 Issue）。

## 本地测试

运行项目自带测试：

```bash
node tests/daily-codex-ping.test.js
```

预期输出：

```text
All tests passed
```

## 快速使用建议

- 希望“每天自动新建任务”→ 使用 **工作流模式**。
- 希望“固定在同一个 Issue 里追踪”→ 使用 **脚本模式**。
- 先验证行为是否正确 → 先用 `dry-run`，确认日志无误后再执行真实评论。
