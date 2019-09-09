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
  for await (const event of min(dt)) {
    lines.push(JSON.stringify(event))
  }
  fs.writeFileSync(filename, lines.join('\n') + '\n')
}

const pullRange = async (start, end) => {
  let skips = 0
  const compressors = []
  while (start < end) {
    const dt = new Date(start)
    const filename = fileString(dt)
    const br = filename + '.br'
    start += onehour
    if (await fileExists(br)) {
      skips += 1
    } else {
      console.log('writing', filename)
      try {
        await pullHour(dt, filename)
      } catch (e) {
        if (e.statusCode === 404) {
          console.error(404, 'missing resource', filename)
          continue
        } else {
          throw e
        }
      }
      compressors.push((async () => {
        await brotli(filename, br)
        fs.unlinkSync(filename)
      })())
    }
  }
  console.log('awaiting compression')
  await Promise.all(compressors)
  console.log('skipped', skips)
}

const pull = async () => {
  const start = now - ((onehour * 24) * 1) // scan for the last day worth of archives
  // start = (new Date('2019-01-01')).getTime() // pull full year instead{
  const end = now
  await pullRange(start, end)
}

const main = async () => {
  await pull()
}

module.exports = main
module.exports.pullRange = pullRange
