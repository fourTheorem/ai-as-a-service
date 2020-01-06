'use strict'

const { URLSearchParams } = require('url')

const signedAxios = require('aws-signed-axios')
const pino = require('pino')
const { ssm } = require('middy/middlewares')
const middy = require('middy')
const loggerMiddleware = require('lambda-logger-middleware')

const BATCH_SIZE = 5

const level =
  process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
const log = pino({
  name: 'scheduler-service',
  level
})

function getBatch(event) {
  const frontierUrl = process.env.FRONTIER_URL
  const { url } = event
  const queryParams = new URLSearchParams({
    status: 'PENDING',
    limit: BATCH_SIZE
  })
  log.debug({ url, frontierUrl }, 'Fetching batch for seed URL')
  return signedAxios({
    method: 'GET',
    url: `${frontierUrl}/${encodeURIComponent(url)}?${queryParams}`
  }).then(({ data: items }) => ({
    items,
    count: items.length
  }))
}

function putSeed(event) {
  const frontierUrl = process.env.FRONTIER_URL
  const { url } = event
  log.debug({ url, frontierUrl }, 'Putting seed URL')
  const fullUrl = `${frontierUrl}/${encodeURIComponent(url)}`
  return signedAxios({
    method: 'POST',
    url: fullUrl
  }).then(result => result.data)
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
  getBatch,
  putSeed
})
