# say-hello

用于每天自动创建一个“最小变更 PR”，并请 `@codex` 做 review。

## 当前行为

- 工作流：`.github/workflows/daily-codex-comment.yml`
- 触发时间：每天 **北京时间 08:00**（UTC `0 0 * * *`）
- 执行内容：
  1. 生成/更新 `.github/daily-codex-pr.md`（仅写入当次时间）
  2. 自动创建或更新 PR（无需合入）
  3. 在该 PR 下评论 `@codex` 发起 review

支持 `workflow_dispatch` 手动触发。
