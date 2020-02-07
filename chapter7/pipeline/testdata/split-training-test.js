/*
 * Randomly split input data file into two sets
 * one for training and one for test
 */
'use strict'

const fs = require('fs')
const rl = require('readline')

const SAMPLE_INTERVAL = 30
let count = 0

var lineReader = rl.createInterface({
  input: fs.createReadStream(process.argv[2])
})

let out = {
  train: [],
  test: {
    all: [],
    neg: [],
    pos: []
  }
}

lineReader.on('line', (line) => {
  const lo = JSON.parse(line)
  if (count === SAMPLE_INTERVAL) {
    out.test.all.push(lo)
    if (lo.overall <= 1) {
      out.test.neg.push(lo)
    }
    if (lo.overall >= 5) {
      out.test.pos.push(lo)
    }
    count = 0
  } else {
    out.train.push(lo)
  }
  count++
})

lineReader.on('close', () => {
  console.log(`${out.train.length} training points, ${out.test.all.length} test points, ${out.test.pos.length} +ve, ${out.test.neg.length} -ve`)
  fs.writeFileSync(`./${process.argv[3]}`, JSON.stringify(out, null, 2), 'utf8')
})

