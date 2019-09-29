#!/usr/bin/env node
const action = require('./lib/action')
const pullHour = require('./lib/pull-hour')

const outputOptions = yargs => {
  yargs.option('output', {
    alias: 'o',
    description: 'Output file or directory.'
  })
  yargs.positional('start', {
    description: 'Time to start the search at, defaults to 24 hours before now'
  })
}

const getTime = dt => (new Date(dt)).getTime()

const pullRange = yargs => {
  const start = getTime(yargs.starttime)
  const end = getTime(yargs.endtime)
  return action.pullRange(start, end)
}

const yargs = require('yargs')
const args = yargs
  .command('pull-hour [datetime]', 'pull an hour of gharchive', outputOptions, pullHour)
  .command('pull <starttime> <endtime>', 'pull a timerange', outputOptions, pullRange)
  .command('action [start]', 'run the hourly github action', () => {}, action)
  .argv

if (!args._.length) {
  yargs.showHelp()
}
