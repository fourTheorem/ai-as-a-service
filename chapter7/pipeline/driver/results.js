'use strict'

const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const asnc = require('async')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', '.env'))))


function deleteKey (s3, bucket, key, cb) {
  console.log('deleting: ' + key)

  const params = {
    Bucket: bucket,
    Key: key
  }
  s3.deleteObject(params, (err, data) => {
    if (err) { console.log(err) }
    cb(err)
  })
}


function cleanBucket (bucket, cb) {
  const s3 = new AWS.S3()
  let params = {
    Bucket: bucket,
    MaxKeys: 1000
  }
  s3.listObjectsV2(params, (err, data) => {
    if (err) { return cb(err) }

    asnc.eachSeries(data.Contents, (file, asnCb) => {
      deleteKey(s3, bucket, file.Key, asnCb)
    }, (err) => {
      cb(err, 'done')
    })
  })
}


function viewBucket (bucket, cb) {
  const s3 = new AWS.S3()
  let params = {
    Bucket: bucket,
    MaxKeys: 1000
  }
  s3.listObjectsV2(params, (err, data) => {
    if (err) { return cb(err) }
    asnc.eachSeries(data.Contents, (file, asnCb) => {
      params = {
        Bucket: bucket,
        Key: file.Key
      }
      s3.getObject(params, (err, data) => {
        if (err) { return asnCb(err) }
        const resObj = JSON.parse(data.Body.toString())
        console.log(file.Key.split('/')[0])
        console.log(resObj.text)
        console.log(resObj.sentiment)
        console.log(resObj.sentimentScore)
        console.log()
        asnCb()
      })
    }, (err) => {
      cb(err, 'done')
    })
  })
}


if (process.argv.length < 3) {
  console.log('usage: node results.js [clean | view]')
} else {
  if (process.argv[2] === 'clean') {
    cleanBucket(env.CHAPTER7_PIPELINE_PROCESSING_BUCKET, err => {
      if (err) { console.log(err) }
    })
  }
  if (process.argv[2] === 'view') {
    viewBucket(env.CHAPTER7_PIPELINE_PROCESSING_BUCKET, err => {
      if (err) { console.log(err) }
    })
  }
}

