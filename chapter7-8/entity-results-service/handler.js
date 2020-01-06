'use strict'

const AWS = require('aws-sdk')
const middy = require('middy')
const { ssm } = require('middy/middlewares')
const signedAxios = require('aws-signed-axios')
const loggerMiddleware = require('lambda-logger-middleware')
const log = require('./log')

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT_URL
})

function middyExport(exports) {
  Object.keys(exports).forEach(key => {
    module.exports[key] = middy(exports[key])
      .use(
        loggerMiddleware({
          logger: log
        })
      )
      .use(
        ssm({
          cache: true,
          names: {
            FRONTIER_URL: `/${process.env.STAGE}/frontier/url`
          }
        })
      )
  })
}

middyExport({
  processResults
})
