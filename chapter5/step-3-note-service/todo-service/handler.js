'use strict'

const uuid = require('uuid')
const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
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


function removeEmpty (data) {
  if (data.action.length === 0) { data.action = null }
  if (data.note.length === 0) { data.note = null }
}


module.exports.create = (event, context, cb) => {
  const data = JSON.parse(event.body)
  removeEmpty(data)

  data.id = uuid.v1()
  data.modifiedTime = new Date().getTime()

  const params = { ...TABLE_NAME, Item: data }
  dynamoDb.put(params, (err, data) => {
    respond(err, {data: data}, cb)
  })
}


module.exports.read = (event, context, cb) => {
  const params = { ...TABLE_NAME, Key: { id: event.pathParameters.id } }
  dynamoDb.get(params, (err, data) => {
    respond(err, data, cb)
  })
}


module.exports.update = (event, context, cb) => {
  const data = JSON.parse(event.body)
  removeEmpty(data)

  data.id = event.pathParameters.id
  data.modifiedTime = new Date().getTime()
  const params = { ...TABLE_NAME, Item: data }

  dynamoDb.put(params, (err, data) => {
    console.log(err)
    console.log(data)
    respond(err, data, cb)
  })
}


module.exports.delete = (event, context, cb) => {
  const params = { ...TABLE_NAME, Key: { id: event.pathParameters.id } }
  dynamoDb.delete(params, (err, data) => {
    respond(err, data, cb)
  })
}


module.exports.list = (event, context, cb) => {
  const params = TABLE_NAME
  dynamoDb.scan(params, (err, data) => {
    respond(err, data, cb)
  })
}

