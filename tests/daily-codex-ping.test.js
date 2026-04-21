const assert = require('node:assert/strict')
const {
  buildCommentBody,
  normalizeMode,
  resolvePullRequestNumber,
  run
} = require('../.github/scripts/daily-codex-ping')

async function testBuildCommentBody() {
  const fixedDate = new Date('2026-04-20T00:00:00.000Z')
  const body = buildCommentBody(fixedDate)

  assert.match(body, /\[Codex Auto Ping\] 2026-04-20/)
  assert.match(body, /@codex/)
}

async function testNormalizeMode() {
  assert.equal(normalizeMode('both'), 'both')
  assert.equal(normalizeMode('issue'), 'issue_only')
  assert.equal(normalizeMode('pr'), 'pr_only')
}

async function testResolvePullRequestNumberFromInput() {
  const pullNumber = await resolvePullRequestNumber({
    github: {},
    context: {},
    core: { info: () => {} },
    pullNumber: '42'
  })

  assert.equal(pullNumber, 42)
}

async function testResolvePullRequestNumberFromList() {
  const pullNumber = await resolvePullRequestNumber({
    github: {
      rest: {
        pulls: {
          list: async () => ({
            data: [
              { number: 11, draft: true },
              { number: 9, draft: false }
            ]
          })
        }
      }
    },
    context: { repo: { owner: 'o', repo: 'r' } },
    core: { info: () => {} },
    pullNumber: ''
  })

  assert.equal(pullNumber, 9)
}

async function testDryRunBothMode() {
  const logs = []
  const result = await run({
    github: {
      rest: {
        pulls: {
          list: async () => ({ data: [{ number: 13, draft: false }] })
        }
      }
    },
    context: { repo: { owner: 'o', repo: 'r' } },
    core: { info: (msg) => logs.push(msg) },
    dryRun: true,
    mode: 'both',
    now: new Date('2026-04-20T00:00:00.000Z')
  })

  assert.equal(result.dryRun, true)
  assert.equal(result.mode, 'both')
  assert.equal(result.actions.length, 2)
  assert.match(logs.join('\n'), /DRY RUN/)
}

async function testCreateIssueAndPrComment() {
  let createdIssue = false
  let issueCommented = false
  let prCommented = false

  const result = await run({
    github: {
      rest: {
        pulls: {
          list: async () => ({ data: [{ number: 21, draft: false }] })
        },
        issues: {
          create: async () => {
            createdIssue = true
            return { data: { number: 7, html_url: 'https://example.com/issue/7' } }
          },
          createComment: async (payload) => {
            if (payload.issue_number === 7) {
              issueCommented = true
            }

            if (payload.issue_number === 21) {
              prCommented = true
            }

            assert.match(payload.body, /@codex/)
            return { data: { html_url: `https://example.com/comment/${payload.issue_number}` } }
          }
        }
      }
    },
    context: { repo: { owner: 'owner', repo: 'repo' } },
    core: { info: () => {} },
    dryRun: false,
    mode: 'both',
    now: new Date('2026-04-20T00:00:00.000Z')
  })

  assert.equal(createdIssue, true)
  assert.equal(issueCommented, true)
  assert.equal(prCommented, true)
  assert.equal(result.dryRun, false)
  assert.equal(result.issueNumber, 7)
  assert.equal(result.pullNumber, 21)
}

async function main() {
  await testBuildCommentBody()
  await testNormalizeMode()
  await testResolvePullRequestNumberFromInput()
  await testResolvePullRequestNumberFromList()
  await testDryRunBothMode()
  await testCreateIssueAndPrComment()
  console.log('All tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
