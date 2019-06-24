'use strict'

const src = require('./source.json')
let out = { Records: [] }

src.forEach(item => {
  const str = JSON.stringify(item)
  const outItem = {
    kinesis: {
      data: Buffer.from(str).toString('base64')
    }
  }
  out.Records.push(outItem)
})
console.log(JSON.stringify(out, null, 2))
