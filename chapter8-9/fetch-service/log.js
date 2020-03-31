'use strict'

const pino = require('pino')

module.exports = pino({
  name: 'fetch-service',
  level:
    process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
})
