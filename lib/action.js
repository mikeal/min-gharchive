const fs = require('fs')
const brotli = require('brotli-max')
const mkdirp = require('mkdirp')
const min = require('../')

const onehour = 1000 * 60 * 60
const now = Date.now() - (onehour * 3) // set back 3 hours

const dataDir = process.cwd()

const fileString = ts => {
  const year = ts.getUTCFullYear()
  const month = (ts.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = ts.getUTCDate().toString().toString().padStart(2, '0')
  const hour = ts.getUTCHours()
  const dir = `${dataDir}/${year}/${month}/${day}`
  mkdirp.sync(dir)
  const name = `${dir}/${year}-${month}-${day}-${hour}.json`
  return name
}

const fileExists = async path => {
  try {
    await fs.promises.stat(path)
    return true
  } catch (e) {
    if (e.errno !== -2) throw e
  }
  return false
}

const pullHour = async (dt, filename) => {
  const lines = []
  const repos = new Set()
  for await (const event of min(dt)) {
    if (event.repo) repos.add(event.repo)
    lines.push(JSON.stringify(event))
  }
  fs.writeFileSync(filename, lines.join('\n') + '\n')
  return repos
}

const pull = async () => {
  let start = now - ((onehour * 24) * 1) // scan for the last day worth of archives
  // start = (new Date('2019-01-01')).getTime() // pull full year instead{
  let skips = 0
  while (start < now) {
    const dt = new Date(start)
    const filename = fileString(dt)
    const br = filename + '.br'
    if (await fileExists(br)) {
      skips += 1
    } else {
      console.log('writing', filename)
      const repos = await pullHour(dt, filename)
      console.log(repos.size, 'unique repos')
      console.log('compressing', br)
      await brotli(filename, br)
      fs.unlinkSync(filename)
    }
    start += onehour
  }
  console.log('skipped', skips)
}

const main = async () => {
  await pull()
}

module.exports = main
