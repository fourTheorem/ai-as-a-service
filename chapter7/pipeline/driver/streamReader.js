/*
 * Read data from Kinesis streams
 * usage:
 *   node streamReader.js [translate | sentiment]
 */
'use strict'

const fs = require('fs')
const path = require('path')
const moment = require('moment')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', '.env'))))
const AWS = require('aws-sdk')

const kinesis = new AWS.Kinesis()


function readRecords (iterator, cb) {
  var params = {
    ShardIterator: iterator,
    Limit: '100'
  }
  kinesis.getRecords(params, (err, data) => {
    if (err) { return cb(err) }
    shardIterator = data.NextShardIterator
    console.log('read MillisBehindLatest: ' + data.MillisBehindLatest)
    if (data.Records && data.Records.length > 0) {
      data.Records.forEach((record) => {
        console.log(JSON.stringify(JSON.parse(record.Data.toString()), null, 2))
      })
    }
    cb(null)
  })
}


let shardIterator
let inter

function readFromStream (streamName, cb) {
  var params = {
    ShardId: '0',
    ShardIteratorType: 'AT_TIMESTAMP',
    StreamName: streamName,
    Timestamp: moment().subtract(60, 'minutes').toISOString()
  }
  kinesis.getShardIterator(params, (err, data) => {
    if (err) { return cb(err) }
    shardIterator = data.ShardIterator
    inter = setInterval(() => {
      readRecords(shardIterator, (err) => {
        if (err || shardIterator === null) {
          clearInterval(inter)
          cb(err)
        }
      })
    }, 1000)
  })
}


if (process.argv.length < 3) {
  console.log('usage: node streamReader.js [translate| sentiment]')
} else {
  if (process.argv[2] === 'translate') {
    readFromStream(env.CHAPTER7_PIPELINE_TRANSLATE_STREAM, err => {
      console.log(err)
    })
  } else {
    readFromStream(env.CHAPTER7_PIPELINE_SENTIMENT_STREAM, err => {
      console.log(err)
    })
  }
}

