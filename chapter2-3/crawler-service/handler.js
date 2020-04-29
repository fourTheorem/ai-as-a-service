'use strict'

const request = require('request')
const urlParser = require('url')
const URLSearchParams = require('url').URLSearchParams
const shortid = require('shortid')
const asnc = require('async')
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
  let queueUrl = `https://sqs.${process.env.REGION}.amazonaws.com/${accountId}/${process.env.ANALYSIS_QUEUE}`

  let params = {
    MessageBody: JSON.stringify({action: 'analyze', msg: {domain: domain}}),
    QueueUrl: queueUrl
  }

  return new Promise(resolve => {
    sqs.sendMessage(params, (err, data) => {
      if (err) { console.log('QUEUE ERROR: ' + err); return resolve({statusCode: 500, body: err}) }
      console.log('queued analysis: ' + queueUrl)
      resolve({statusCode: 200, body: {queue: queueUrl, msgId: data.MessageId}})
    })
  })
}


module.exports.crawlImages = function (event, context, cb) {
  asnc.eachSeries(event.Records, (record, asnCb) => {
    let { body } = record

    try {
      body = JSON.parse(body)
    } catch (exp) {
      return asnCb('message parse error: ' + record)
    }

    if (body.action === 'download' && body.msg && body.msg.url) {
      const udomain = createUniqueDomain(body.msg.url)
      crawl(udomain, body.msg.url, context).then(result => {
        queueAnalysis(udomain, body.msg.url, context).then(result => {
          asnCb(null, result)
        })
      })
    } else {
      asnCb('malformed message')
    }
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

