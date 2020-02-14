/*
 * send random test data through the pipeline
 * usage:
 *   node driver.js [auto | beauty | office | pet] [pos | neg]
 */
'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', '.env'))))
const req = require('request')
const fileMap = {
  auto: '../testdata/data/automotive.json',
  beauty: '../testdata/data/beauty.json',
  office: '../testdata/data/office.json',
  pet: '../testdata/data/pet.json'
}


function randomInt (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}


function postData (department, sentiment, cb) {
  const dataSet = require(fileMap[department])
  let data

  if (sentiment === 'pos') {
    data = dataSet.test.pos
  } else {
    data = dataSet.test.neg
  }

  const msg = {
    originalText: data[randomInt(0, data.length - 1)].reviewText,
    source: 'twitter',
    orignator: '@pelger'
  }

  req({
    method: 'POST',
    url: env.CHAPTER7_PIPELINE_API,
    body: JSON.stringify(msg)
  }, (err, res, body) => {
    if (err || res.statusCode !== 200) { return cb({statusCode: res.statusCode, err: err, body: body.toString()}) }
    console.log(err)
    console.log(body.toString())
    cb(null)
  })
}


if (process.argv.length < 4) {
  console.log('usage: node driver.js [auto | beauty | office | pet] [pos | neg]')
} else {
  postData(process.argv[2], process.argv[3], (err) => {
    console.log(err)
  })
}

