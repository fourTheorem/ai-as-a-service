/*
 * detects sentiment
 *
 * message in
 * {
 *   source: 'twitter', 'email', 'facebook'
 *   originator: '@pelger anon...
 *   originalText:
 *   text:
 *   sourceLanguage:
 * }
 */

'use strict'

const uuidv1 = require('uuid/v1')
const AWS = require('aws-sdk')
const asnc = require('async')
const comp = new AWS.Comprehend()
const s3 = new AWS.S3()
const IN_DIR = 'in'


function writeNegativeSentiment (message, cb) {
  const fn = uuidv1()
  s3.putObject({Bucket: process.env.CHAPTER7_PIPELINE_PROCESSING_BUCKET, Key: IN_DIR + '/' + fn + '.json', Body: Buffer.from(JSON.stringify(message), 'utf8')}, (err, data) => {
    cb(err, data)
  })
}


module.exports.detect = function (event, context, cb) {
  asnc.eachSeries(event.Records, (record, asnCb) => {
    const payload = new Buffer(record.kinesis.data, 'base64').toString('utf8')
    let message

    try {
      message = JSON.parse(payload)
    } catch (exp) {
      console.log('failed to parse message')
      return asnCb(null)
    }
    let outMsg = message

    let params = {
      LanguageCode: 'en',
      Text: message.text
    }
    comp.detectSentiment(params, (err, data) => {
      if (err) { return asnCb(err) }
      outMsg.sentiment = data.Sentiment

      if (data.Sentiment === 'NEGATIVE') {
        writeNegativeSentiment(outMsg, (err, data) => {
          asnCb(err)
        })
      } else {
        asnCb(null)
      }
    })
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

