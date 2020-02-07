'use strict'

const req = require('request')
const fs = require('fs')


module.exports = function (env) {

  function getSignedUrl (cb) {
    req({
      method: 'GET',
      url: env.CHAPTER6_GETUPLOAD_URL
    }, (err, res, body) => {
      if (err || res.statusCode !== 200) { return cb({statusCode: res.statusCode, err: err, body: body.toString()}) }
      cb(null, JSON.parse(body.toString()))
    })
  }


  function uploadImage (localFilePath, cb) {
    getSignedUrl((err, signed) => {
      if (err) { return cb(err) }
      fs.readFile(localFilePath, (err, data) => {
        if (err) { return cb(err) }
        req({
          method: 'PUT',
          url: signed.url,
          body: data
        }, (err, res, body) => {
          if (err || res.statusCode !== 200) { return cb({statusCode: res.statusCode, err: err, body: body.toString()}) }
          cb(null, signed.key)
        })
      })
    })
  }


  function analyze (key, cb) {
    req({
      method: 'POST',
      url: env.CHAPTER6_ANALYZE_URL,
      body: JSON.stringify({imageKey: key})
    }, (err, res, body) => {
      if (err || res.statusCode !== 200) { return cb({statusCode: res.statusCode, err: err, body: body.toString()}) }
      cb(null, JSON.parse(body))
    })
  }


  return {
    uploadImage,
    analyze
  }
}

