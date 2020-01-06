'use strict'

const pino = require('pino')

const log = pino({ name: 'pino-logging-example' })

log.info({ a: 1, b: 2 }, 'Hello world')

const err = new Error('Something failed')
log.error({ err })
