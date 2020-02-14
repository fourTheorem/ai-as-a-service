'use strict'

const pino = require('pino')

const log = pino({
  name: 'preparation-service',
  level:
    process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
})

module.exports = log
