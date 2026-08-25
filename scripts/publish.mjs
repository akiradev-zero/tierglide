#!/usr/bin/env node
import { copyFileSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const CONTENT_FILE = 'content/lists.json'
const COMMIT_MESSAGE = 'Publish list updates'

function die(message) {
  console.error(`publish: ${message}`)
  process.exit(1)
}

function git(args) {
  return spawnSync('git', args, { encoding: 'utf8' })
}

function validateContent(filePath) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    die(`${filePath} is not valid JSON (${err.message})`)
  }
  if (!parsed || !Array.isArray(parsed.lists)) {
    die(`${filePath} must be an object with a "lists" array.`)
  }
  const bad = parsed.lists.findIndex(
    (l) =>
      !l ||
      typeof l.id !== 'string' ||
      !Array.isArray(l.entries) ||
      l.entries.length < 3 ||
      l.entries.length > 10 ||
      !Array.isArray(l.versions),
  )
  if (bad !== -1) {
    die(`lists[${bad}] is malformed (needs an id, versions, and 3–10 entries).`)
  }
}

const sourceArg = process.argv[2]

if (sourceArg) {
  validateContent(sourceArg)
  copyFileSync(sourceArg, CONTENT_FILE)
  console.log(`publish: copied ${sourceArg} -> ${CONTENT_FILE}`)
} else {
  console.log(
    'publish: no source file given; assuming you already replaced content/lists.json\n' +
    '         (export it from the app: "Export for publish" in the authoring bar)',
  )
}

validateContent(CONTENT_FILE)

const status = git(['status', '--porcelain', '--', CONTENT_FILE])
if (status.error) die(`git status failed: ${status.error.message}`)
if (status.stdout.trim() === '') {
  console.log('publish: content/lists.json unchanged — nothing to publish.')
  process.exit(0)
}

const add = git(['add', CONTENT_FILE])
if (add.status !== 0) die(`git add failed:\n${add.stderr}`)

const commit = git(['commit', '-m', COMMIT_MESSAGE])
if (commit.status !== 0) die(`git commit failed:\n${commit.stderr || commit.stdout}`)

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
const branchName = branch.stdout.trim() || 'main'

console.log(`publish: committed ${CONTENT_FILE} on ${branchName}`)
const push = git(['push', 'origin', branchName])
if (push.status !== 0) {
  console.error(`publish: push failed:\n${push.stderr}`)
  console.error('publish: the commit exists locally — resolve and push manually to deploy.')
  process.exit(1)
}
console.log('publish: pushed. GitHub Actions will build and deploy the site shortly.')
