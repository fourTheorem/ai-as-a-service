'use strict'

const AWS = require('aws-sdk')
const middy = require('middy')
const loggerMiddleware = require('lambda-logger-middleware')

const log = require('./log')

const KEY_PREFIX = 'sites/'

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT_URL
})

function prepare(event) {
  const record = event.Records[0]
  const bucketName = record.s3.bucket.name
  const key = decodeURIComponent(record.s3.object.key)

  const object = { Bucket: bucketName, Key: key }
  log.info({ object }, 'Getting S3 Object')
  return s3
    .getObject(object)
    .promise()
    .then(({ Body: body }) => body)
    .then(body => body.toString())
    .then(text => {
      const textObjectKey = `incoming-texts/${key
        .substring(KEY_PREFIX.length)
        .replace(/page.txt$/, 'pending.txt')}`
      log.info({ bucketName, key, textObjectKey }, 'Uploading extracted text')
      return s3
        .putObject({
          Body: text,
          Bucket: bucketName,
          Key: textObjectKey
        })
        .promise()
    })
}

function middyExport(exports) {
  Object.keys(exports).forEach(key => {
    module.exports[key] = middy(exports[key]).use(
      loggerMiddleware({
        logger: log
      })
    )
  })
}

middyExport({
  prepare
})
