'use strict'

const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({region: process.env.REGION})


function invoke (name, message, cb) {
  const params = {
    FunctionName: name,
    InvocationType: 'Event',
    Payload: message
  }
  lambda.invoke(params, function (err, data) {
    cb(err)
  })
}


module.exports.distribute = function (event, context, cb) {
  event.Records.forEach(record => {
    const { body } = record
    let bodyObj

    try {
      bodyObj = JSON.parse(body)
    } catch (exp) {
      console.log('message parse error: ' + body)
      return cb()
    }

    if (bodyObj.action === 'download' && bodyObj.msg && bodyObj.msg.url) {
      invoke('crawler-service-dev-crawlImages', body, function (err) {
        if (err) { console.log('function call error: ' + err) }
        cb()
      })
    } else if (bodyObj.action === 'analyze' && bodyObj.msg && bodyObj.msg.domain) {
      invoke('analysis-service-dev-analyzeImages', body, function (err) {
        if (err) { console.log('function call error: ' + err) }
        cb()
      })
    } else {
      console.log('malformed message: ' + body)
      cb()
    }
  })
}

