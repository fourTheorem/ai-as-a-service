'use strict'

const urlParser = require('url')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const sqs = new AWS.SQS({region: process.env.REGION})


function readStatus (folder) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: folder + 'status.json'
  }
  console.log(JSON.stringify(params, null, 2))
  return new Promise((resolve) => {
    s3.getObject(params, (err, data) => {
      if (err) { return resolve({stat: err}) }
      let statFile = JSON.parse(data.Body.toString())
      resolve(statFile)
    })
  })
}


function respond (code, body, cb) {
  const response = {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  }
  console.log(JSON.stringify(response))
  cb(null, response)
}


module.exports.analyzeUrl = (event, context, cb) => {
  let accountId = process.env.ACCOUNTID
  if (!accountId) {
    accountId = context.invokedFunctionArn.split(':')[4]
  }
  const queueUrl = `https://sqs.${process.env.REGION}.amazonaws.com/${accountId}/${process.env.QUEUE}`
  const body = JSON.parse(event.body)

  const params = {
    MessageBody: JSON.stringify({action: 'download', msg: body}),
    QueueUrl: queueUrl
  }

  console.log(JSON.stringify(params, null, 2))

  sqs.sendMessage(params, (err, data) => {
    if (err) { return respond(500, {stat: 'error', details: err}, cb) }
    respond(200, {stat: 'ok', details: {queue: queueUrl, msgId: data.MessageId}}, cb)
  })
}


module.exports.listUrls = (event, context, cb) => {
  const params = {
    Bucket: process.env.BUCKET,
    Delimiter: '/',
    MaxKeys: 1000
  }

  s3.listObjectsV2(params, (err, data) => {
    let promises = []
    if (err) { return respond(500, {stat: 'error', details: err}, cb) }

    data.CommonPrefixes.forEach(prefix => {
      promises.push(readStatus(prefix.Prefix))
    })
    Promise.all(promises).then(values => {
      let result = []
      values.forEach(value => {
        result.push({url: value.url, stat: value.stat})
      })
      respond(200, {stat: 'ok', details: result}, cb)
    })
  })
}


module.exports.listImages = (event, context, cb) => {
  const url = event.queryStringParameters.url
  const domain = urlParser.parse(url).hostname

  console.log('list images')
  readStatus(domain + '/').then(result => {
    respond(200, {stat: 'ok', details: result}, cb)
  })
}

