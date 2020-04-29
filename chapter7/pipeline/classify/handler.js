/*
 * runs a custom classifier to determine which of the following lines of business
 * the document fits within
 * AUTO, OFFICE, BEAUTY, PET
 */

'use strict'

const AWS = require('aws-sdk')
const asnc = require('async')
const uuidv1 = require('uuid/v1')

const s3 = new AWS.S3()
const comp = new AWS.Comprehend()


const classes = {
  AUTO: 'auto',
  OFFICE: 'office',
  BEAUTY: 'beauty',
  PET: 'pet',
  UNCLASSIFIED: 'unclassified'
}


function writeToBucket (clas, message, cb) {
  const fn = uuidv1()
  s3.putObject({
    Bucket: process.env.CHAPTER7_PIPELINE_PROCESSING_BUCKET,
    Key: clas + '/' + fn + '.json',
    Body: Buffer.from(JSON.stringify(message), 'utf8')
  }, (err) => {
    cb(err)
  })
}


function determineClass (result) {
  let clas = classes.UNCLASSIFIED
  let max = 0
  let ptr

  result.Classes.forEach(cl => {
    if (cl.Score > max) {
      max = cl.Score
      ptr = cl
    }
  })
  if (ptr.Score > 0.95) {
    clas = classes[ptr.Name]
  }
  return clas
}


module.exports.classify = function (event, context, cb) {
  asnc.eachSeries(event.Records, (record, asnCb) => {
    const payload = new Buffer(record.kinesis.data, 'base64').toString('utf8')
    let message

    try {
      message = JSON.parse(payload)
    } catch (exp) {
      console.log('failed to parse message')
      return asnCb(null)
    }

    let params = {
      EndpointArn: process.env.CHAPTER7_ENDPOINT_ARN,
      Text: message.text
    }
    comp.classifyDocument(params, (err, data) => {
      if (err) { return asnCb(err) }
      let clas = determineClass(data)
      writeToBucket(clas, message, (err) => {
        if (err) { return asnCb(err) }
        asnCb()
      })
    })
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

