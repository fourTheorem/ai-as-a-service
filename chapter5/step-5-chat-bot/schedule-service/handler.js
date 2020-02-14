'use strict'

const moment = require('moment')
const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const polly = new AWS.Polly()
const s3 = new AWS.S3()
const TABLE_NAME = { TableName: process.env.TODO_TABLE }


function respond (err, body, cb) {
  let statusCode = 200

  body = body || {}
  if (err) {
    body.stat = 'err'
    body.err = err
    if (err.statusCode) {
      statusCode = err.statusCode
    } else {
      statusCode = 500
    }
  } else {
    body.stat = 'ok'
  }

  const response = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      statusCode: statusCode
    },
    body: JSON.stringify(body)
  }

  cb(null, response)
}


function buildSchedule (date, speakDate, cb) {
  let speech = '<s>Your schedule for ' + speakDate + '</s>'
  let added = false
  const params = TABLE_NAME

  dynamoDb.scan(params, (err, data) => {
    data.Items.forEach((item) => {
      if (item.dueDate === date) {
        added = true
        speech += '<s>' + item.action + '</s>'
        speech += '<s>' + item.note + '</s>'
      }
    })
    if (!added) {
      speech += '<s>You have no scheduled actions</s>'
    }
    const ssml = `<speak><p>${speech}</p></speak>`
    cb(err, {ssml: ssml})
  })
}


module.exports.day = (event, context, cb) => {
  let date = moment().format('MM/DD/YYYY')
  let speakDate = moment().format('dddd, MMMM Do YYYY')
  buildSchedule(date, speakDate, (err, schedule) => {
    if (err) { return respond(err, null, cb) }

    let params = {
      OutputFormat: 'mp3',
      SampleRate: '8000',
      Text: schedule.ssml,
      LanguageCode: 'en-GB',
      TextType: 'ssml',
      VoiceId: 'Joanna',
      OutputS3BucketName: process.env.CHAPTER4_DATA_BUCKET,
      OutputS3KeyPrefix: 'schedule'
    }

    polly.startSpeechSynthesisTask(params, (err, data) => {
      if (err) { return respond(err, null, cb) }

      let result = {
        taskId: data.SynthesisTask.TaskId,
        taskStatus: data.SynthesisTask.TaskStatus,
        taskUri: data.SynthesisTask.OutputUri
      }
      respond(err, result, cb)
    })
  })
}


module.exports.poll = (event, context, cb) => {
  polly.getSpeechSynthesisTask({TaskId: event.pathParameters.id}, (err, data) => {
    if (err) { return respond(err, null, cb) }

    let params = {Bucket: process.env.CHAPTER4_DATA_BUCKET, Key: 'schedule.' + data.SynthesisTask.TaskId + '.mp3'}
    let signedUrl = s3.getSignedUrl('getObject', params)
    let result = {
      taskId: data.SynthesisTask.TaskId,
      taskStatus: data.SynthesisTask.TaskStatus,
      taskUri: data.SynthesisTask.OutputUri,
      signedUrl: signedUrl
    }
    respond(err, result, cb)
  })
}

