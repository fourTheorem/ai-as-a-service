'use strict'

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const env = dotenv.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', '.env'))))
const client = require('./client')(env)


function parseResult (result) {
  // result = require('./data/passport3.json')
  let info = {}

  result.Blocks.forEach((block, idx) => {
    if (block.BlockType === 'LINE' && block.Confidence > 90) {
      if (/Nationality/g.test(block.Text)) {
        info.nationality = result.Blocks[idx + 1].Text
      }
      if (/Date.+birth/g.test(block.Text)) {
        info.dob = result.Blocks[idx + 1].Text
      }
      if (/Place.+birth/g.test(block.Text)) {
        info.placeOfBirth = result.Blocks[idx + 2].Text
      }
      if (/Date.+expiration/g.test(block.Text)) {
        info.dateOfExpiration = result.Blocks[idx + 1].Text
      }
      if (/Date.+issue/g.test(block.Text)) {
        info.dateOfIssue = result.Blocks[idx + 2].Text
      }
      if (/Given.+Names/g.test(block.Text)) {
        info.givenNames = result.Blocks[idx + 2].Text
      }
      if (/Surname/g.test(block.Text)) {
        info.surname = result.Blocks[idx + 2].Text
      }
      if (/^\d+$/g.test(block.Text)) {
        if (block.Text.length > 5) {
          info.passportNumber = block.Text
        }
      }
      console.log(block.Text)
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

