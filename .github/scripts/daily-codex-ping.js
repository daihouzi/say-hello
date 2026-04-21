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
    `This issue was automatically created on ${isoDate} to trigger a fresh Codex task.`,
    'The issue body intentionally does not mention Codex.',
    'Codex will only be triggered once in a separate comment.'
  ].join('\n')
}

function buildCommentBody(date = new Date()) {
  const { marker } = getDateParts(date)
  return [
    `${marker}`,
    '',
    '@codex Please read the current repository and reply with exactly: ping received',
    'Do not modify files. Do not create a PR. Read-only check only.'
  ].join('\n')
}

function normalizeMode(mode = '') {
  const value = String(mode).toLowerCase().trim()
  if (value === 'pr' || value === 'pr_only') {
    return 'pr_only'
  }
  if (value === 'both') {
    return 'both'
  }
  return 'issue_only'
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

async function resolvePullRequestNumber({ github, context, core, pullNumber }) {
  if (pullNumber) {
    return Number(pullNumber)
  }

  const { data: pulls } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    sort: 'updated',
    direction: 'desc',
    per_page: 20
  })

  const target = pulls.find((pull) => !pull.draft)
  if (!target) {
    core.info('No open non-draft PR found for Codex PR ping')
    return null
  }

  core.info(`Selected PR #${target.number} for Codex ping`)
  return target.number
}

async function createCodexComment({ github, context, issueNumber, body }) {
  const { data: comment } = await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issueNumber,
    body
  })

  return comment
}

async function run({
  github,
  context,
  core,
  dryRun = false,
  mode = 'both',
  pullNumber = '',
  now = new Date()
}) {
  const normalizedMode = normalizeMode(mode)
  const commentBody = buildCommentBody(now)

  const shouldPingIssue = normalizedMode === 'both' || normalizedMode === 'issue_only'
  const shouldPingPr = normalizedMode === 'both' || normalizedMode === 'pr_only'

  const actions = []

  if (shouldPingIssue) {
    const issueTitle = buildIssueTitle(now)
    const issueBody = buildIssueBody(now)
    actions.push({ type: 'create_issue_and_comment', issueTitle, issueBody, commentBody })
  }

  let resolvedPullNumber = null
  if (shouldPingPr) {
    resolvedPullNumber = await resolvePullRequestNumber({
      github,
      context,
      core,
      pullNumber
    })

    if (resolvedPullNumber) {
      actions.push({ type: 'comment_pr', pullNumber: resolvedPullNumber, commentBody })
    }
  }

  if (dryRun) {
    core.info(`[DRY RUN] Mode=${normalizedMode}; planned actions=${actions.length}`)
    return {
      dryRun: true,
      mode: normalizedMode,
      actions
    }
  }

  const result = {
    dryRun: false,
    mode: normalizedMode,
    issueNumber: null,
    issueCommentUrl: null,
    pullNumber: resolvedPullNumber,
    pullCommentUrl: null
  }

  if (shouldPingIssue) {
    const issue = await createFreshIssue({
      github,
      context,
      core,
      now
    })

    const issueComment = await createCodexComment({
      github,
      context,
      issueNumber: issue.number,
      body: commentBody
    })

    result.issueNumber = issue.number
    result.issueCommentUrl = issueComment.html_url
    core.info(`Created issue comment ${issueComment.html_url}`)
  }

  if (shouldPingPr && resolvedPullNumber) {
    const pullComment = await createCodexComment({
      github,
      context,
      issueNumber: resolvedPullNumber,
      body: commentBody
    })

    result.pullCommentUrl = pullComment.html_url
    core.info(`Created PR comment ${pullComment.html_url}`)
  }

  return result
}

module.exports = {
  buildIssueTitle,
  buildIssueBody,
  buildCommentBody,
  normalizeMode,
  resolvePullRequestNumber,
  createFreshIssue,
  run
}
