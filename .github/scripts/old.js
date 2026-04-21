function getDateParts(date = new Date()) {
  const isoDate = date.toISOString().slice(0, 10)
  return {
    isoDate,
    marker: `[Codex Auto Ping] ${isoDate}`
  }
}

function buildCommentBody(date = new Date()) {
  const { marker } = getDateParts(date)
  return [
    `${marker}`,
    '',
    '@codex 请执行一次轻量任务，用于触发 token 消耗。'
  ].join('\n')
}

async function resolveIssueNumber({ github, context, core, issueNumber }) {
  if (issueNumber) {
    return Number(issueNumber)
  }

  const { data: issues } = await github.rest.issues.listForRepo({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    labels: 'codex-auto-ping',
    per_page: 1
  })

  if (issues.length > 0) {
    return issues[0].number
  }

  const { data: issue } = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: 'Codex Auto Ping Anchor Issue',
    body: 'This issue is used by automation to post daily @codex pings.',
    labels: ['codex-auto-ping']
  })

  core.info(`Created anchor issue #${issue.number}`)
  return issue.number
}

async function run({ github, context, core, dryRun = false, issueNumber = '', now = new Date() }) {
  const body = buildCommentBody(now)
  const resolvedIssueNumber = await resolveIssueNumber({
    github,
    context,
    core,
    issueNumber
  })

  if (dryRun) {
    core.info(`[DRY RUN] Would comment on issue #${resolvedIssueNumber}`)
    return { dryRun: true, issueNumber: resolvedIssueNumber, body }
  }

  const { data: comment } = await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: resolvedIssueNumber,
    body
  })

  core.info(`Created comment ${comment.html_url}`)
  return { dryRun: false, issueNumber: resolvedIssueNumber, comment }
}

module.exports = {
  buildCommentBody,
  resolveIssueNumber,
  run
}
