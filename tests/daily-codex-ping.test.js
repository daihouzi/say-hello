const assert = require('node:assert/strict')
const {
  buildCommentBody,
  resolveIssueNumber,
  run
} = require('../.github/scripts/daily-codex-ping')

async function testBuildCommentBody() {
  const fixedDate = new Date('2026-04-20T00:00:00.000Z')
  const body = buildCommentBody(fixedDate)

  assert.match(body, /\[Codex Auto Ping\] 2026-04-20/)
  assert.match(body, /@codex/)
}

async function testResolveIssueNumberFromInput() {
  const issueNumber = await resolveIssueNumber({
    github: {},
    context: {},
    core: { info: () => {} },
    issueNumber: '42'
  })
  assert.equal(issueNumber, 42)
}

async function testResolveIssueNumberFromList() {
  const issueNumber = await resolveIssueNumber({
    github: {
      rest: {
        issues: {
          listForRepo: async () => ({ data: [{ number: 9 }] })
        }
      }
    },
    context: { repo: { owner: 'o', repo: 'r' } },
    core: { info: () => {} },
    issueNumber: ''
  })

  assert.equal(issueNumber, 9)
}

async function testDryRun() {
  const logs = []
  const result = await run({
    github: {
      rest: {
        issues: {
          listForRepo: async () => ({ data: [{ number: 3 }] })
        }
      }
    },
    context: { repo: { owner: 'o', repo: 'r' } },
    core: { info: (msg) => logs.push(msg) },
    dryRun: true,
    now: new Date('2026-04-20T00:00:00.000Z')
  })

  assert.equal(result.dryRun, true)
  assert.equal(result.issueNumber, 3)
  assert.match(logs.join('\n'), /DRY RUN/)
}

async function testCreateComment() {
  let commented = false
  const result = await run({
    github: {
      rest: {
        issues: {
          listForRepo: async () => ({ data: [{ number: 7 }] }),
          createComment: async (payload) => {
            commented = true
            assert.equal(payload.issue_number, 7)
            assert.match(payload.body, /@codex/)
            return { data: { html_url: 'https://example.com/comment/1' } }
          }
        }
      }
    },
    context: { repo: { owner: 'owner', repo: 'repo' } },
    core: { info: () => {} },
    dryRun: false,
    now: new Date('2026-04-20T00:00:00.000Z')
  })

  assert.equal(commented, true)
  assert.equal(result.dryRun, false)
}

async function main() {
  await testBuildCommentBody()
  await testResolveIssueNumberFromInput()
  await testResolveIssueNumberFromList()
  await testDryRun()
  await testCreateComment()
  console.log('All tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
