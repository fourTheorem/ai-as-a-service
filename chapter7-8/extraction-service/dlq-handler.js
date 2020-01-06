'use strict'

const lambdaDlqRetry = require('lambda-dlq-retry')
const handler = require('./handler')
const log = require('log')

module.exports = {
  retry: lambdaDlqRetry({ handler: handler.extract, log })
}
