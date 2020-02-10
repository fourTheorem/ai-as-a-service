'use strict'

const uuid = require('uuid/v1')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const txt = new AWS.Textract()


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


module.exports.uploadLink = function (event, context, cb) {
  const key = 'in/' + uuid() + '.jpg'
  const params = {
    Bucket: process.env.CHAPTER7_IMAGE_BUCKET,
    Key: key,
    Expires: 300
  }
  s3.getSignedUrl('putObject', params, function (err, url) {
    respond(err, {key: key, url: url}, cb)
  })
}


module.exports.analyze = function (event, context, cb) {
  const data = JSON.parse(event.body)
  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.CHAPTER7_IMAGE_BUCKET,
        Name: data.imageKey
      }
    },
    FeatureTypes: ['TABLES', 'FORMS']
  }

  txt.analyzeDocument(params, (err, data) => {
    respond(err, data, cb)
  })
}

