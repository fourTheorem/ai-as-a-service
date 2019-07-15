'use strict'

const { URL } = require('url')

const signedAxios = require('aws-signed-axios')
const { Address4 } = require('ip-address')
const middy = require('middy')
const parseDomain = require('parse-domain')
const pino = require('pino')
const { ssm } = require('middy/middlewares')
const loggerMiddleware = require('lambda-logger-middleware')

const level =
  process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
const log = pino({
  name: 'strategy-service',
  level
})

const MAX_DEPTH = process.env.MAX_DEPTH || 1
log.info({ MAX_DEPTH }, 'Strategy maximum depth')

function handleDiscoveredUrls(event, context) {
  const frontierUrl = process.env.FRONTIER_URL

  log.debug(`Got ${event.Records.length} items`)

  const items = event.Records.map(({ body }) => {
    const { item, link } = JSON.parse(body)
    return {
      seed: item.seed,
      referrer: item.url,
      url: link.href,
      label: link.text,
      depth: item.depth + 1
    }
  }).filter(newItem => {
    if (newItem.depth > MAX_DEPTH) {
      log.debug(
        `Rejecting ${newItem.url} with depth (${newItem.depth}) beyond limit`
      )
    } else if (!shouldFollow(newItem.seed, newItem.url)) {
      log.debug(
        `Rejecting ${newItem.url} from a different domain to seed ${
          newItem.seed
        }`
      )
    } else {
      return true
    }
    return false
  })

  log.debug({ items }, 'Sending new URLs to Frontier')
  return items.length > 0
    ? signedAxios({
        method: 'PUT',
        url: frontierUrl,
        data: items
      }).then(() => ({}))
    : Promise.resolve({})
}

function shouldFollow(seed, to) {
  let seedURL, toURL
  try {
    seedURL = new URL(seed)
    toURL = new URL(to)
  } catch (err) {
    log.debug({ err, seedURL, toURL }, `Rejecting due to invalid URL`)
    return false
  }

  if (!toURL.hostname) {
    log.debug(`Rejecting ${toURL} as invalid`)
    return false
  }
  if (seedURL.hostname === toURL.hostname) {
    return true
  }
  if (new Address4(toURL.hostname).isValid()) {
    log.debug(`Rejecting ${toURL} as it's an IP address`)
    return false
  }
  const parsedSeed = parseDomain(seedURL.hostname)
  const parsedTo = parseDomain(toURL.hostname)
  if (
    !parsedSeed ||
    !parsedTo ||
    parsedSeed.domain !== parsedTo.domain ||
    parsedSeed.tld !== parsedTo.tld
  ) {
    log.debug(`Rejecting ${to} from a different domain to seed ${seed}`)
    return false
  }
  return true
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
  handleDiscoveredUrls
})
