/*
 * detects language and translates to English if required
 * message in
 * {
 *   source: 'twitter', 'email', 'facebook'
 *   originator: '@pelger anon...
 *   originalText:
 * }
 */

'use strict'

const AWS = require('aws-sdk')
const asnc = require('async')

const comp = new AWS.Comprehend()
const trans = new AWS.Translate()
const kinesis = new AWS.Kinesis()


function writeToSentimentStream (msg, cb) {
  const params = {
    Data: JSON.stringify(msg),
    PartitionKey: '1',
    StreamName: process.env.CHAPTER6_PIPELINE_SENTIMENT_STREAM
  }
  kinesis.putRecord(params, (err, data) => {
    cb(err)
  })
}


module.exports.translate = function (event, context, cb) {
  let out = []

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
      Text: message.originalText
    }
    comp.detectDominantLanguage(params, (err, data) => {
      if (err) { return asnCb(err) }

      outMsg.originalLanguage = data.Languages[0].LanguageCode
      if (data.Languages[0].LanguageCode === 'en') {
        outMsg.text = message.originalText
        out.push(outMsg)
        writeToSentimentStream(outMsg, asnCb)
      } else {
        params = {
          SourceLanguageCode: data.Languages[0].LanguageCode,
          TargetLanguageCode: 'en',
          Text: message.originalText
        }
        trans.translateText(params, (err, data) => {
          if (err) { return asnCb(err) }
          outMsg.text = data.TranslatedText
          writeToSentimentStream(outMsg, asnCb)
        })
      }
    })
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

