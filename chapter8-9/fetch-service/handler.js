'use strict'

const AWS = require('aws-sdk')
const signedAxios = require('aws-signed-axios')
const Promise = require('bluebird')
const pino = require('pino')
const browser = require('./browser')

const cwEvents = new AWS.CloudWatchEvents({
  endpoint: process.env.CLOUDWATCH_ENDPOINT_URL
})
const s3 = new AWS.S3({ endpoint: process.env.S3_ENDPOINT_URL })
const ssm = new AWS.SSM({ endpoint: process.env.SSM_ENDPOINT_URL })

const log = pino({
  name: 'fetch-service',
  level:
    process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
})

const itemStoreBucket = process.env.ITEM_STORE_BUCKET

function fetch(event) {
  return Promise.map(event, item => {
    const { seed, url } = item
    log.debug({ url }, 'Loading URL')
    return browser
      .load(url)
      .then(
        ({ links, html, text, screenshotData }) =>
          storeItems(seed, url, html, text, screenshotData).then(() =>
            dispatchUrlDiscoveredEvents(item, links).then(() => ({
              ...item,
              status: 'FETCHED'
            }))
          ),
        err => {
          log.error({ err, item }, 'Failed to fetch')
          return {
            ...item,
            status: 'FAILED'
          }
        }
      )
      .then(result => sendResult(seed, url, result))
  })
}

const frontierUrlPromise = ssm
  .getParameter({
    Name: `/${process.env.STAGE}/frontier/url`
  })
  .promise()
  .then(result => result.Parameter.Value)

function sendResult(seed, url, result) {
  return frontierUrlPromise
    .then(frontierUrl =>
      signedAxios({
        method: 'PATCH',
        url: `${frontierUrl}/${encodeURIComponent(seed)}/${encodeURIComponent(
          url
        )}`,
        data: result
      })
    )
    .then(() => ({
      url,
      result
    }))
}

function storeItems(seed, url, html, text, screenshotData) {
  const keyPrefix = `sites/${encodeURIComponent(seed)}/${encodeURIComponent(
    url
  )}`

  log.debug({ keyPrefix }, 'Storing assets')

  return Promise.all([
    s3
      .putObject({
        Bucket: itemStoreBucket,
        Body: Buffer.from(screenshotData, 'base64'),
        Key: `${keyPrefix}/screenshot.png`
      })
      .promise(),
    s3
      .putObject({
        Bucket: itemStoreBucket,
        Body: Buffer.from(text, 'utf-8'),
        Key: `${keyPrefix}/page.txt`
      })
      .promise(),
    s3
      .putObject({
        Bucket: itemStoreBucket,
        Body: Buffer.from(html, 'utf-8'),
        Key: `${keyPrefix}/page.html`
      })
      .promise()
  ])
}

function dispatchUrlDiscoveredEvents(item, links) {
  if (links.length > 0) {
    if (links.length > 10) {
      return dispatchUrlDiscoveredEvents(item, links.splice(0, 10)).then(() =>
        dispatchUrlDiscoveredEvents(item, links)
      )
    }

    const eventEntries = links.map(link => ({
      Detail: JSON.stringify({
        item,
        link
      }),
      Source: 'fetch-service',
      DetailType: 'url.discovered'
    }))

    log.debug({ item, links }, 'Dispatching discovered URLs')
    return cwEvents
      .putEvents({
        Entries: eventEntries
      })
      .promise()
      .then(() => {})
  }
  return Promise.resolve()
}

module.exports = {
  fetch
}
