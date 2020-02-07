/*
 * runs a custom classifier to determine which of the following lines of business
 * the document fits within
 * AUTO, OFFICE, BEAUTY, PET
 */

'use strict'

const mail = {
  AUTO: {
    address: 'auto@fourtheorem.com'
  },
  OFFICE: {
    address: 'office@fourtheorem.com'
  },
  BEAUTY: {
    address: 'beauty@fourtheorem.com'
  },
  PET: {
    address: 'pet@fourtheorem.com'
  },
  UNCLASSIFIED: {
    address: 'complaints@fourtheorem.com'
  }
}


function determineAddress (line) {
  let address = mail.UNCLASSIFIED.address
  let max = 0
  let ptr

  line.Classes.forEach(cl => {
    if (cl.Score > max) {
      max = cl.Score
      ptr = cl
    }
  })
  if (ptr.Score > 0.90) {
    address = mail[ptr.Name].address
  }
  return address
}


module.exports.buildOutput = function (meta, res) {
  let output = {}

  res.split('\n').forEach(line => {
    if (line.length > 0) {
      const jline = JSON.parse(line)
      const addr = determineAddress(jline)
      if (!output[addr]) {
        output[addr] = []
      }
      output[addr].push({
        text: meta[jline.Line].text,
        sourceLanguage: meta[jline.Line].originalLanguage,
        orignator: meta[jline.Line].orignator,
        source: meta[jline.Line].source
      })
    }
  })
  return output
}

