/*
 * runs a custom classifier to determine which of the following lines of business
 * the document fits within
 * AUTO, OFFICE, BEAUTY, PET
 */

'use strict'

const AWS = require('aws-sdk')
const asnc = require('async')
const url = require('url')
const gunzip = require('gunzip-maybe')
const tar = require('tar-stream')
const streamifier = require('streamifier')
const stos = require('stream-to-string')
const mailer = require('./mailer')

const s3 = new AWS.S3()
const comp = new AWS.Comprehend()

const IN_DIR = 'in'
const PROC_DIR = 'proc'


function deleteKey (key, cb) {
  var params = {
    Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
    Key: key
  }
  s3.deleteObject(params, (err, data) => {
    if (err) { console.log(err) }
    cb && cb()
  })
}


function aggregate (cb) {
  let lineNo = 0
  let dataFile = ''
  let metaData = {}

  let params = {
    Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
    Prefix: IN_DIR,
    MaxKeys: 1000
  }
  s3.listObjectsV2(params, (err, data) => {
    if (err) { return cb(err) }

    asnc.eachSeries(data.Contents, (file, asnCb) => {
      params = {
        Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
        Key: file.Key
      }
      s3.getObject(params, (err, data) => {
        if (err) { return asnCb(err) }

        const msg = JSON.parse(data.Body.toString())
        metaData[lineNo] = msg
        lineNo++
        dataFile += msg.text + '\n'

        deleteKey(file.Key)
        asnCb()
      })
    }, (err) => {
      if (err) { return cb(err) }
      s3.putObject({Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET, Key: PROC_DIR + '/meta.json', Body: Buffer.from(JSON.stringify(metaData), 'utf8')}, (err, data) => {
        if (err) { return cb(err) }
        s3.putObject({Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET, Key: PROC_DIR + '/proc.dat', Body: Buffer.from(dataFile, 'utf8')}, (err, data) => {
          cb(err)
        })
      })
    })
  })
}


function startClassifier (cb) {
  const params = {
    DataAccessRoleArn: process.env.CHAPTER6_DATA_ACCESS_ARN,
    DocumentClassifierArn: process.env.CHAPTER6_CLASSIFIER_ARN,
    InputDataConfig: {
      S3Uri: `s3://${process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET}/${PROC_DIR}/proc.dat`,
      InputFormat: 'ONE_DOC_PER_LINE'
    },
    OutputDataConfig: {
      S3Uri: `s3://${process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET}/${PROC_DIR}/results`
    }
  }
  comp.startDocumentClassificationJob(params, (err, data) => {
    if (err) { return cb(err) }
    const jobJson = { jobId: data.JobId }
    s3.putObject({Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET, Key: PROC_DIR + '/jobid.json', Body: Buffer.from(JSON.stringify(jobJson), 'utf8')}, (err, data) => {
      cb(err)
    })
  })
}


function extract (body, cb) {
  const extract = tar.extract()
  let result = ''

  const tgz = streamifier.createReadStream(body)
  extract.on('entry', (header, stream, next) => {
    stos(stream, (err, msg) => {
      err
      result += msg
      next()
    })
  })

  extract.on('finish', () => {
    cb(result)
  })
  tgz.pipe(gunzip()).pipe(extract)
}


function processResults (res, cb) {
  const purl = url.parse(res.outputUrl)
  const key = purl.pathname.substring(1)

  const s3Obj = new AWS.S3({maxRetries: 10, signatureVersion: 'v4'})

  const params = {
    Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
    Key: PROC_DIR + '/meta.json'
  }
  s3Obj.getObject(params, (err, meta) => {
    if (err) { return cb(err) }

    const metaJson = JSON.parse(meta.Body.toString())
    const params = {
      Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
      Key: key
    }
    s3Obj.getObject(params, (err, data) => {
      if (err) { return cb(err) }

      extract(data.Body, (results) => {
        console.log(results)
        cb(null, mailer.buildOutput(metaJson, results))
      })
    })
  })
}


function pollInProgressJob (cb) {
  let result = { status: 'none' }
  const params = {
    Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
    Key: PROC_DIR + '/jobid.json'
  }
  s3.getObject(params, (err, data) => {
    if (err) { console.log('no in progress jobs'); return cb(null, result) } // error if job file doesn't exist, in this case end poll

    result.status = 'running'
    const jobid = JSON.parse(data.Body.toString())
    result.jobid = jobid.jobId
    const params = {
      JobId: jobid.jobId
    }
    comp.describeDocumentClassificationJob(params, (err, data) => {
      if (err) { return cb(err) }
      console.log(data.DocumentClassificationJobProperties)
      if (data.DocumentClassificationJobProperties.JobStatus === 'COMPLETED') {
        result.status = 'completed'
        result.outputUrl = data.DocumentClassificationJobProperties.OutputDataConfig.S3Uri
      }
      cb(null, result)
    })
  })
}


module.exports.cleanup = function (event, context, cb) {
  let params = {
    Bucket: process.env.CHAPTER6_PIPELINE_PROCESSING_BUCKET,
    Prefix: PROC_DIR,
    MaxKeys: 1000
  }
  s3.listObjectsV2(params, (err, data) => {
    if (err) { return cb(err) }

    asnc.eachSeries(data.Contents, (file, asnCb) => {
      deleteKey(file.Key, asnCb)
    }, (err) => {
      console.log('done.')
      cb(err)
    })
  })
}


module.exports.poll = function (event, context, cb) {
  pollInProgressJob((err, result) => {
    if (err) { return cb(err) }
    console.log(result.status)

    if (result.status === 'none') { return cb() }
    if (result.status === 'completed') {
      processResults(result, (err, output) => {
        if (err) { return cb(err) }
        console.log(JSON.stringify(output, null, 2))
      })
    }
  })
}


module.exports.classify = function (event, context, cb) {
  aggregate(err => {
    if (err) { return cb(err) }
    startClassifier(err => {
      cb(err)
    })
  })
}

