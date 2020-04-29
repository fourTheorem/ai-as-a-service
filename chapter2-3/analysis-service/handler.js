'use strict'

const asnc = require('async')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const rek = new AWS.Rekognition()


function analyzeImageLabels (imageBucketKey) {
  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.BUCKET,
        Name: imageBucketKey
      }
    },
    MaxLabels: 10,
    MinConfidence: 80
  }
  return new Promise((resolve, reject) => {
    rek.detectLabels(params, (err, data) => {
      if (err) { return resolve({image: imageBucketKey, labels: [], err: err}) }
      return resolve({image: imageBucketKey, labels: data.Labels})
    })
  })
}


function writeAnalysis (domain, labels, wcList) {
  return new Promise((resolve) => {
    var params = {
      Bucket: process.env.BUCKET,
      Key: domain + '/status.json'
    }

    s3.getObject(params, (err, data) => {
      if (err) { return resolve({stat: err}) }
      let statFile = JSON.parse(data.Body.toString())
      statFile.analysisResults = labels
      statFile.wordCloudList = wcList
      statFile.stat = 'analyzed'
      s3.putObject({Bucket: process.env.BUCKET, Key: domain + '/status.json', Body: Buffer.from(JSON.stringify(statFile, null, 2), 'utf8')}, (err, data) => {
        resolve({stat: err || 'ok'})
      })
    })
  })
}


function wordCloudList (labels) {
  let counts = {}
  let wcList = []

  labels.forEach(set => {
    set.labels.forEach(lab => {
      if (!counts[lab.Name]) {
        counts[lab.Name] = 1
      } else {
        counts[lab.Name] = counts[lab.Name] + 1
      }
    })
  })

  Object.keys(counts).forEach(key => {
    wcList.push([key, counts[key]])
  })
  return wcList
}


function iterateBucket (domain) {
  let promises = []
  const params = {
    Bucket: process.env.BUCKET,
    Prefix: domain,
    MaxKeys: 1000
  }

  return new Promise(resolve => {
    s3.listObjectsV2(params, (err, data) => {
      if (err) { return resolve({statusCode: 500, body: JSON.stringify(err)}) }
      data.Contents.forEach(imageFile => {
        if (imageFile.Key !== domain + '/status.json') {
          promises.push(analyzeImageLabels(imageFile.Key))
        }
      })

      Promise.all(promises).then(results => {
        writeAnalysis(domain, results, wordCloudList(results)).then(result => {
          resolve({statusCode: 200, body: JSON.stringify(result)})
        })
      })
    })
  })
}


module.exports.analyzeImages = function (event, context, cb) {
  asnc.eachSeries(event.Records, (record, asnCb) => {
    let { body } = record

    try {
      body = JSON.parse(body)
    } catch (exp) {
      return asnCb('message parse error: ' + record)
    }

    if (body.action === 'analyze' && body.msg && body.msg.domain) {
      iterateBucket(body.msg.domain, context).then(result => {
        asnCb(null, result)
      })
    } else {
      asnCb()
    }
  }, (err) => {
    if (err) { console.log(err) }
    cb()
  })
}

