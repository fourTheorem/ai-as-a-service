'use strict'

const request = require('request')
const urlParser = require('url')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const sqs = new AWS.SQS({region: process.env.REGION})
const images = require('./images')()

function writeStatus (url, domain, results) {
  const statFile = {
    url: url,
    stat: 'downloaded',
    downloadResults: results
  }

  return new Promise((resolve) => {
    s3.putObject({Bucket: process.env.BUCKET, Key: domain + '/status.json', Body: Buffer.from(JSON.stringify(statFile, null, 2), 'utf8')}, (err, data) => {
      resolve({stat: err || 'ok'})
    })
  })
}


function crawl (url, context) {
  const domain = urlParser.parse(url).hostname

  console.log('crawling: ' + url)
  return new Promise(resolve => {
    request(url, (err, response, body) => {
      if (err || response.statusCode !== 200) { return resolve({statusCode: 500, body: err}) }
      images.parseImageUrls(body, url).then(urls => {
        images.fetchImages(urls, domain).then(results => {
          writeStatus(url, domain, results).then(result => {
            resolve({statusCode: 200, body: JSON.stringify(result)})
          })
        })
      })
    })
  })
}


function queueAnalysis (url, context) {
  const domain = urlParser.parse(url).hostname
  let accountId = process.env.ACCOUNTID
  if (!accountId) {
    accountId = context.invokedFunctionArn.split(':')[4]
  }
  let queueUrl = `https://sqs.${process.env.REGION}.amazonaws.com/${accountId}/${process.env.QUEUE}`

  let params = {
    MessageBody: JSON.stringify({action: 'analyze', msg: {domain: domain}}),
    QueueUrl: queueUrl
  }

  return new Promise(resolve => {
    sqs.sendMessage(params, (err, data) => {
      if (err) { return resolve({statusCode: 500, body: err}) }
      console.log('queued analysis: ' + queueUrl)
      resolve({statusCode: 200, body: {queue: queueUrl, msgId: data.MessageId}})
    })
  })
}


module.exports.crawlImages = function (event, context, cb) {
  if (event.action === 'download' && event.msg && event.msg.url) {
    crawl(event.msg.url, context).then(result => {
      cb(null, result)
      queueAnalysis(event.msg.url, context).then(result => {
        cb(null, result)
      })
    })
  } else {
    cb('malformed message')
  }
}

