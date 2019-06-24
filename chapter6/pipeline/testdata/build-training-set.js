/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const fs = require('fs')
const input = require(process.argv[2])
const label = process.argv[3]

let output = ''

input.train.forEach(item => {
  if (item.reviewText.length > 50) {
    output += `${label}, ${item.reviewText.replace(/,/g, ' ')}\n`
  }
})


fs.writeFileSync(`./data/${process.argv[3]}`, output, 'utf8')

