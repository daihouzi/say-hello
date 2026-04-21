# say-hello

每天北京时间 08:00 自动执行：创建一个包含当次时间的最小改动 PR，并在 PR 下 `@codex` 发起 review。

- 工作流：`.github/workflows/daily-codex-comment.yml`
- 触发：`cron: 0 0 * * *`（UTC）+ `workflow_dispatch`
- 每次运行都会创建**新的** PR（独立分支）
- PR 不要求合并
