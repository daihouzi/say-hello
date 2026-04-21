function getDateParts(date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10)
  return {
    isoDate,
    marker: `[Codex Auto Ping] ${isoDate}`
  }
}

function buildIssueTitle(date = new Date()) {
  const { isoDate } = getDateParts(date)
  return `Codex Auto Ping ${isoDate}`
}

function buildIssueBody(date = new Date()) {
  const { marker, isoDate } = getDateParts(date)
  return [
    `${marker}`,
    '',
    `This issue was automatically created on ${isoDate} to trigger a fresh @codex task.`,
    'It intentionally avoids reusing an old thread, so Codex does not inherit stale task context.'
  ].join('\n')
}

function buildCommentBody(date = new Date()) {
  const { marker } = getDateParts(date)
  return [
    `${marker}`,
    '',
    '@codex 请阅读当前仓库，并回复一句“ping received”。不要修改代码，不要创建 PR，只执行只读检查。'
  ].join('\n')
}

async function createFreshIssue({ github, context, core, now }) {
  const title = buildIssueTitle(now)
  const body = buildIssueBody(now)

  const { data: issue } = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title,
    body,
    labels: ['codex-auto-ping']
  })

  core.info(`Created fresh issue #${issue.number}: ${issue.html_url}`)
  return issue
}

async function run({ github, context, core, dryRun = false, now = new Date() }) {
  const issueTitle = buildIssueTitle(now)
  const issueBody = buildIssueBody(now)
  const commentBody = buildCommentBody(now)

  if (dryRun) {
    core.info('[DRY RUN] Would create a fresh issue and post a Codex comment')
    return {
      dryRun: true,
      issueTitle,
      issueBody,
      commentBody
    }
  }

  const issue = await createFreshIssue({
    github,
    context,
    core,
    now
  })

  const { data: comment } = await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issue.number,
    body: commentBody
  })

  core.info(`Created comment ${comment.html_url}`)
  return {
    dryRun: false,
    issueNumber: issue.number,
    issue,
    comment
  }
}

module.exports = {
  buildIssueTitle,
  buildIssueBody,
  buildCommentBody,
  createFreshIssue,
  run
}
