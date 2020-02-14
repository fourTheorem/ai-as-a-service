'use strict'

const request = require('request')
const AWS = require('aws-sdk')
var trans = new AWS.TranscribeService()


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


module.exports.transcribe = (event, context, cb) => {
  const body = JSON.parse(event.body)

  const params = {
    LanguageCode: body.noteLang,
    Media: { MediaFileUri: body.noteUri },
    MediaFormat: body.noteFormat,
    TranscriptionJobName: body.noteName,
    MediaSampleRateHertz: body.noteSampleRate,
    Settings: {
      ChannelIdentification: false,
      MaxSpeakerLabels: 4,
      ShowSpeakerLabels: true
    }
  }

  trans.startTranscriptionJob(params, (err, data) => {
    respond(err, data, cb)
  })
}


module.exports.poll = (event, context, cb) => {
  const params = { TranscriptionJobName: event.pathParameters.id }

  console.log(JSON.stringify(params))
  trans.getTranscriptionJob(params, (err, data) => {
    if (err) {
      console.log(err)
      return respond(err, {}, cb)
    }

    if (data && data.TranscriptionJob) {
      if (data.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
        request(data.TranscriptionJob.Transcript.TranscriptFileUri, (err, response, responseBody) => {
          let result
          if (!err && response && response.statusCode === 200) {
            result = JSON.parse(responseBody)
          } else {
            result = {resultErr: err, resultResponse: response.statusCode}
          }
          result.transcribeStatus = data.TranscriptionJob.TranscriptionJobStatus
          console.log(JSON.stringify(result))

          respond(err, result, cb)
        })
      } else {
        console.log(JSON.stringify({transcribeStatus: data.TranscriptionJob.TranscriptionJobStatus}))
        respond(err, {transcribeStatus: data.TranscriptionJob.TranscriptionJobStatus}, cb)
      }
    } else {
      respond(err, {}, cb)
    }
  })
}

