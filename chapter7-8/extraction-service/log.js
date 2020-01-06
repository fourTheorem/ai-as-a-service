'use strict'

const pino = require('pino')

const log = pino({
  name: 'extraction-service',
  level:
    process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
})

module.exports = log
