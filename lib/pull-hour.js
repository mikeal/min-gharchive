const min = require('../')
const fs = require('fs')

const onehour = 1000 * 60 * 60

const pullHour = async argv => {
  const dt = argv.datetime ? new Date(argv.datetime) : new Date(Date.now() - onehour)
  let outs
  if (argv.output) {
    outs = fs.createWriteStream(argv.output)
  } else {
    outs = process.stdout
  }
  for await (const event of min(dt)) {
    outs.write(JSON.stringify(event))
    outs.write('\n')
  }
  outs.end()
}

module.exports = pullHour
