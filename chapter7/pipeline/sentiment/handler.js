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

const AWS = require('aws-sdk')
const asnc = require('async')
const comp = new AWS.Comprehend()
const kinesis = new AWS.Kinesis()


function writeNegativeSentiment (msg, cb) {
  const params = {
    Data: JSON.stringify(msg),
    PartitionKey: '1',
    StreamName: process.env.CHAPTER7_PIPELINE_CLASSIFY_STREAM
  }
  kinesis.putRecord(params, (err, data) => {
    cb(err)
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

      if (data.Sentiment === 'NEGATIVE' || data.Sentiment === 'NEUTRAL' || data.Sentiment === 'MIXED') {
        writeNegativeSentiment(outMsg, (err, data) => {
          asnCb(err)
        })
      } else {
        if (data.SentimentScore.Positive < 0.85) {
          writeNegativeSentiment(outMsg, (err, data) => {
            asnCb(err)
          })
        } else {
          asnCb(null)
        }
      }
    })
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

