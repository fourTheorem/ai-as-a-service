'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', '.env'))))
const client = require('./client')(env)


function parseResult (result) {
  let info = {}

  result.Blocks.forEach((block, idx) => {
    if (block.BlockType === 'LINE' && block.Confidence > 75) {
      if (/Nationality/g.test(block.Text)) {
        info.nationality = result.Blocks[idx + 1].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Date.+birth/g.test(block.Text)) {
        info.dob = result.Blocks[idx + 1].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Place.+birth/g.test(block.Text)) {
        info.placeOfBirth = result.Blocks[idx + 2].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Date.+expiration/g.test(block.Text)) {
        info.dateOfExpiration = result.Blocks[idx + 1].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Date.+issue/g.test(block.Text)) {
        info.dateOfIssue = result.Blocks[idx + 2].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Given.+Names/g.test(block.Text)) {
        info.givenNames = result.Blocks[idx + 2].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/Surname/g.test(block.Text)) {
        info.surname = result.Blocks[idx + 2].Text + ' (confidence: ' + block.Confidence + ')'
      }
      if (/^\d+$/g.test(block.Text)) {
        if (block.Text.length > 5) {
          info.passportNumber = block.Text + ' (confidence: ' + block.Confidence + ')'
        }
      }
    }
  })
  return info
}


client.uploadImage('./data/passport3.jpg', (err, key) => {
  if (err) { return console.log(err) }
  client.analyze(key, (err, result) => {
    if (err) { return console.log(err) }
    const info = parseResult(result)
    console.log(JSON.stringify(info, null, 2))
  })
})

