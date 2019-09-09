const JSONStream = require('jsonstream2')
const zlib = require('zlib')
const bent = require('bent')

const get = bent('https://data.gharchive.org/')

const tsToFilename = ts => {
  const year = ts.getUTCFullYear()
  const month = (ts.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = ts.getUTCDate().toString().toString().padStart(2, '0')
  const hour = ts.getUTCHours()
  const name = `${year}-${month}-${day}-${hour}.json.gz`
  return name
}

const map = {
  PullRequestEvent: 'pr',
  IssuesEvent: 'issue',
  PushEvent: 'push',
  DeleteEvent: 'del',
  CreateEvent: 'create',
  IssueCommentEvent: 'icomment',
  ForkEvent: 'fork',
  PublicEvent: 'public',
  WatchEvent: 'watch',
  GollumEvent: 'golem',
  PullRequestReviewCommentEvent: 'prcomment',
  ReleaseEvent: 'release',
  MemberEvent: 'member',
  CommitCommentEvent: 'ccomment'
}

const minEvent = type => {
  return map[type]
}

const filterArchive = async function * (ts) {
  const name = tsToFilename(ts)
  const stream = await get(name)
  const reader = stream.pipe(zlib.createUnzip()).pipe(JSONStream.parse())
  for await (const event of reader) {
    const o = {}
    o.id = event.id
    o.dt = event.created_at
    o.repo = event.repo.name
    o.type = minEvent(event.type)
    o.actor = event.actor.login
    if (!o.type) throw new Error(event.type)
    if (event.payload) {
      o.age = event.payload.created_at
      o.action = event.payload.action
      if (event.payload.pull_request) event.pr = true
      if (event.payload.ref && event.payload.ref.startsWith('refs/head')) {
        event.branch = event.payload.ref.slice('refs/head/'.length + 1)
      }
      if (event.payload.commits) {
        o.commits = event.payload.commits.length
      }
      if (event.payload.issue) {
        o.age = event.payload.issue.created_at
      }
      if (event.payload.pull_request) {
        o.age = event.payload.pull_request.created_at
      }
      yield o
    }
  }
}

module.exports = filterArchive
module.exports.tsToFilename = tsToFilename
