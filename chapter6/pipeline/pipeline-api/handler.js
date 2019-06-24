'use strict'

const AWS = require('aws-sdk')
const kinesis = new AWS.Kinesis()


function respond (err, body, cb) {
  let statusCode = 200

  body = body || {}
  if (err) {
    body.stat = 'err'
    body.err = err
    if (err.statusCode) {
      statusCode = err.statusCode
    } else {
      statusCode = 500
    }
  } else {
    body.stat = 'ok'
  }

  const response = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      statusCode: statusCode
    },
    body: JSON.stringify(body)
  }

  cb(null, response)
}


/**
 *  body should be a JDSON string of the format
 *  {
 *    originalText:
 *    source: 'twitter' | 'facebook'...
 *    originator: '@pelger'
 *  }
 */
module.exports.ingest = function (event, context, cb) {
  const params = {
    Data: event.body,
    PartitionKey: '1',
    StreamName: process.env.CHAPTER6_PIPELINE_TRANSLATE_STREAM
  }

  kinesis.putRecord(params, (err, data) => {
    respond(err, {resp: data}, cb)
  })
}

