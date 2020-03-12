'use strict'

const request = require('request')
const urlParser = require('url')
const URLSearchParams = require('url').URLSearchParams
const shortid = require('shortid')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const sqs = new AWS.SQS({region: process.env.REGION})
const images = require('./images')()

function writeStatus (url, domain, results) {
  let parsed = urlParser.parse(url)
  parsed.hostname = domain
  parsed.host = domain
  const statFile = {
    url: urlParser.format(parsed),
    stat: 'downloaded',
    downloadResults: results
  }

  return new Promise((resolve) => {
    s3.putObject({Bucket: process.env.BUCKET, Key: domain + '/status.json', Body: Buffer.from(JSON.stringify(statFile, null, 2), 'utf8')}, (err, data) => {
      resolve({stat: err || 'ok'})
    })
  })
}


function createUniqueDomain (url) {
  const parsed = urlParser.parse(url)
  const sp = new URLSearchParams(parsed.search)
  let domain


  if (sp.get('q')) {
    domain = sp.get('q') + '.' + parsed.hostname
  } else {
    domain = shortid.generate() + '.' + parsed.hostname
  }
  domain = domain.replace(/ /g, '')
  return domain.toLowerCase()
}


function crawl (domain, url, context) {
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


function queueAnalysis (domain, url, context) {
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
    const udomain = createUniqueDomain(event.msg.url)
    crawl(udomain, event.msg.url, context).then(result => {
      queueAnalysis(udomain, event.msg.url, context).then(result => {
        cb(null, result)
      })
    })
  } else {
    cb('malformed message')
  }
}

