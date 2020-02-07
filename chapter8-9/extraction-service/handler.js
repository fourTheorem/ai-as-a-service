'use strict'

const once = require('once')
const readline = require('readline')
const { createGunzip } = require('zlib')
const tar = require('tar-stream')

const AWS = require('aws-sdk')
const signedAxios = require('aws-signed-axios')
const middy = require('middy')
const { ssm } = require('middy/middlewares')
const loggerMiddleware = require('lambda-logger-middleware')
const log = require('./log')

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT_URL
})
const comprehend = new AWS.Comprehend()

const dataAccessRoleArn = process.env.DATA_ACCESS_ROLE_ARN
const itemStoreBucketName = process.env.ITEM_STORE_BUCKET

const COMPREHEND_LANGUAGE_CODE = 'en'
const MAX_BATCH_SIZE = 25
const MAX_COMPREHEND_JOB_COUNT = 10
const INCOMING_TEXTS_PREFIX = 'incoming-texts/'
const ENTITY_RESULTS_PREFIX = 'entity-results/'
const BATCHES_PREFIX = 'batches/'

function getTextBatch() {
  log.info(
    { itemStoreBucketName, INCOMING_TEXTS_PREFIX, MAX_BATCH_SIZE },
    'Listing objects'
  )
  return s3
    .listObjectsV2({
      Bucket: itemStoreBucketName,
      Prefix: INCOMING_TEXTS_PREFIX,
      MaxKeys: MAX_BATCH_SIZE
    })
    .promise()
    .then(({ Contents: items }) =>
      items.map(item => item.Key.substring(INCOMING_TEXTS_PREFIX.length))
    )
    .then(paths => {
      log.info({ paths }, 'Text batch')
      return {
        paths,
        count: paths.length
      }
    })
}

function startBatchProcessing(event) {
  const { paths } = event
  const batchId = new Date().toISOString().replace(/[^0-9]/g, '')
  log.info({ itemStoreBucketName, batchId, paths }, 'Starting batch processing')

  return (
    Promise.all(
      // Copy all files to a batch staging folder
      paths
        .map(path => ({
          Bucket: itemStoreBucketName,
          CopySource: encodeURIComponent(
            `${itemStoreBucketName}/${INCOMING_TEXTS_PREFIX}${path}`
          ),
          Key: `${BATCHES_PREFIX}${batchId}/${path}`
        }))
        .map(copyParams => s3.copyObject(copyParams).promise())
    )
      // Start Processing
      .then(() => startEntityRecognition(batchId))
      // Delete the original files so they won't be reprocessed
      .then(() =>
        Promise.all(
          paths.map(path =>
            s3
              .deleteObject({
                Bucket: itemStoreBucketName,
                Key: `${INCOMING_TEXTS_PREFIX}${path}`
              })
              .promise()
          )
        )
      )
      .then(() => log.info({ paths }, 'Batch process started'))
      .then(() => ({ batchId }))
  )
}

function checkActiveJobs() {
  return comprehend
    .listEntitiesDetectionJobs({
      Filter: { JobStatus: 'IN_PROGRESS' },
      MaxResults: MAX_COMPREHEND_JOB_COUNT
    })
    .promise()
    .then(({ EntitiesDetectionJobPropertiesList: jobList }) => {
      log.debug({ jobList }, 'Entity detection job list retrieved ')
      return {
        count: jobList.length,
        jobs: jobList.map(
          ({ JobId: jobId, JobName: jobName, SubmitTime: submitTime }) => ({
            jobId,
            jobName,
            submitTime
          })
        )
      }
    })
}

function processEntityResults(event) {
  const record = event.Records[0] // Always one item for S3
  const bucketName = record.s3.bucket.name
  const key = decodeURIComponent(record.s3.object.key)

  const gunzip = createGunzip()
  const tarExtract = tar.extract()

  const lines = []
  return new Promise((resolve, reject) => {
    const doReject = once(reject)
    tarExtract.on('entry', (header, stream, next) => {
      const lineReader = readline.createInterface({
        input: stream
      })
      lineReader.on('line', line => lines.push(line))
      lineReader.on('close', () => next())
      stream.resume()
    })

    tarExtract.on('finish', () => {
      log.info('Entity results file extraction complete')
      handleEntityResultLines(lines)
        .then(resolve)
        .catch(doReject)
    })

    s3.getObject({ Bucket: bucketName, Key: key })
      .createReadStream()
      .on('error', doReject)
      .pipe(gunzip)
      .on('error', doReject)
      .pipe(tarExtract)
      .on('error', doReject)
  })
}

function handleEntityResultLines(lines) {
  log.debug({ lines }, 'Handling result lines')
  return Promise.all(
    lines.map(line => {
      const { Entities: comprehendEntities, File: fileName } = JSON.parse(line)
      const [encodedSeed, encodedUrlTextPath] = fileName.split(/\/(.+)/)
      const [, encodedUrl] = encodedUrlTextPath.match(/(.*)\/([^\/]+)$/)
      const entities = comprehendEntities.reduce((acc, item) => {
        const typeList = acc[item.Type] || []
        typeList.push({
          text: item.Text,
          begin: item.BeginOffset,
          end: item.EndOffset,
          score: item.Score
        })
        acc[item.Type] = typeList
        return acc
      }, {})
      return storeEntityResult(encodedSeed, encodedUrl, entities)
    })
  )
}

function startEntityRecognition(batchId) {
  return comprehend
    .startEntitiesDetectionJob({
      JobName: batchId,
      DataAccessRoleArn: dataAccessRoleArn,
      InputDataConfig: {
        InputFormat: 'ONE_DOC_PER_FILE',
        S3Uri: `s3://${itemStoreBucketName}/${BATCHES_PREFIX}${batchId}/`
      },
      LanguageCode: 'en',
      OutputDataConfig: {
        S3Uri: `s3://${itemStoreBucketName}/${ENTITY_RESULTS_PREFIX}${batchId}`
      }
    })
    .promise()
    .then(comprehendResponse => {
      log.info({ batchId, comprehendResponse }, 'Entity detection started')
    })
}

function iterator(event) {
  return Promise.resolve({
    iterations: event.iterator.iterations - 1
  })
}

function storeEntityResult(encodedSeed, encodedUrl, entities) {
  const url = `${process.env.FRONTIER_URL}/${encodedSeed}/${encodedUrl}`
  log.debug({ url }, 'Uploading recognition results')
  return signedAxios({
    method: 'PATCH',
    url,
    data: {
      entities,
      status: 'EXTRACTED'
    }
  })
    .then(() => ({}))
    .catch(err => {
      const response = err.response || {}
      if (response.status) {
        log.error(
          {
            response: {
              data: response.data,
              status: response.status,
              headers: response.headers
            }
          },
          'Error storing recognition result'
        )
      }
      throw err
    })
}

function middyExport(exports) {
  Object.keys(exports).forEach(key => {
    module.exports[key] = middy(exports[key])
      .use(
        loggerMiddleware({
          logger: log
        })
      )
      .use(
        ssm({
          cache: true,
          names: {
            FRONTIER_URL: `/${process.env.STAGE}/frontier/url`
          }
        })
      )
  })
}

middyExport({
  checkActiveJobs,
  getTextBatch,
  startBatchProcessing,
  processEntityResults,
  iterator
})
