'use strict'

const middy = require('middy')
const pino = require('pino')

const {
  cors,
  jsonBodyParser,
  validator,
  httpEventNormalizer,
  httpErrorHandler
} = require('middy/middlewares')

const loggerMiddleware = require('lambda-logger-middleware')
const { autoProxyResponse } = require('middy-autoproxyresponse')

const log = pino({
  name: 'frontier-service',
  level:
    process.env.IS_OFFLINE || process.env.STAGE === 'dev' ? 'debug' : 'info'
})

const AWS = require('aws-sdk')
const localDynamoPort = process.env.DYNAMODB_LOCAL_PORT || 8000
const defaultOptions = {
  convertEmptyValues: true
}

const options = process.env.IS_OFFLINE
  ? {
      region: 'localhost',
      endpoint: `http://localhost:${localDynamoPort}`,
      ...defaultOptions
    }
  : defaultOptions

const docClient = new AWS.DynamoDB.DocumentClient({
  service: new AWS.DynamoDB(options)
})

const STATUS_VALUES = ['PENDING', 'FETCHED', 'FAILED']
const DEFAULT_LIST_LIMIT = 10
const MAX_LIST_LIMIT = 100

const TABLE_NAME = process.env.FRONTIER_TABLE

function list({ pathParameters, queryStringParameters }) {
  const limit = queryStringParameters.limit || DEFAULT_LIST_LIMIT
  const params = {
    TableName: TABLE_NAME,
    IndexName: `${TABLE_NAME}Status`,
    Limit: limit > MAX_LIST_LIMIT ? MAX_LIST_LIMIT : limit,
    KeyConditionExpression: '#seed = :seedVal and #status = :statusVal',
    ExpressionAttributeNames: {
      '#seed': 'seed',
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':seedVal': decodeURIComponent(pathParameters.seed),
      ':statusVal': queryStringParameters.status
    }
  }

  return docClient
    .query(params)
    .promise()
    .then(result => result.Items)
}

list.schema = {
  properties: {
    pathParameters: {
      type: 'object',
      properties: {
        seed: { type: 'string', minLength: 1 }
      },
      required: ['seed']
    },
    queryStringParameters: {
      type: 'object',
      properties: {
        status: {
          enum: STATUS_VALUES
        },
        limit: {
          type: 'number'
        }
      },
      required: ['status']
    }
  },
  required: ['pathParameters', 'queryStringParameters']
}

function create({ body = {}, pathParameters }, context) {
  const { seed, url } = pathParameters
  const item = {
    ...body,
    depth: (body && body.depth) || 0,
    seed: decodeURIComponent(seed),
    url: decodeURIComponent(url || seed),
    status: 'PENDING',
    createdAt: Date.now()
  }
  log.info({ item }, 'Creating with item')

  const params = {
    TableName: TABLE_NAME,
    Item: item
  }

  return docClient
    .put(params)
    .promise()
    .then(() => item)
}

create.schema = {
  pathParameters: {
    type: 'object',
    properties: {
      seed: { type: 'string', minLength: 1 },
      url: { type: 'string', minLength: 0 }
    },
    required: ['seed']
  },
  required: ['pathParameters']
}

function update({ body, pathParameters }, context) {
  const { seed, url } = pathParameters
  const { status } = body

  const params = {
    TableName: TABLE_NAME,
    Key: { seed: decodeURIComponent(seed), url: decodeURIComponent(url) },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status,
      ':updatedAt': Date.now()
    },
    ReturnValues: 'ALL_NEW'
  }

  return docClient
    .update(params)
    .promise()
    .then(result => result)
}

update.schema = {
  pathParameters: {
    type: 'object',
    properties: {
      seed: { type: 'string', minLength: 1 },
      url: { type: 'string', minLength: 0 }
    },
    required: ['seed', 'url']
  },
  body: {
    type: 'object',
    properties: {
      status: { enum: STATUS_VALUES },
      referrer: { type: 'string', minLength: 1 }
    },
    required: ['status']
  },
  required: ['body', 'pathParameters']
}

function bulkInsert({ body }, context) {
  return insertBulkItem([...body])
}

bulkInsert.schema = {
  body: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        seed: { type: 'string', minLength: 1 },
        url: { type: 'string', minLength: 1 },
        referrer: { type: 'string', minLength: 1 },
        depth: { type: 'number' }
      },
      required: ['seed', 'url']
    }
  },
  required: ['body']
}

function insertBulkItem(items) {
  const [item, ...rest] = items
  if (item.label === '') {
    delete item.label
  }
  const params = {
    TableName: TABLE_NAME,
    Item: {
      ...item,
      createdAt: Date.now(),
      status: 'PENDING'
    },
    ConditionExpression: '#seed <> :seedVal AND #url <> :urlVal',
    ExpressionAttributeNames: {
      '#seed': 'seed',
      '#url': 'url'
    },
    ExpressionAttributeValues: {
      ':seedVal': item.seed,
      ':urlVal': item.url
    }
  }
  log.debug({ params }, 'Bulk insert params')

  let promise = docClient
    .put(params)
    .promise()
    .then(result => [item])
    .catch(err => {
      if (err.code === 'ConditionalCheckFailedException') {
        return [] // Nothing added for this item
      }
      throw err
    })

  if (rest.length) {
    promise = promise.then(results =>
      insertBulkItem(rest).then(nextResults => [...results, ...nextResults])
    )
  }
  return promise
}

function middyExport(exports) {
  Object.keys(exports).forEach(key => {
    module.exports[key] = middy(exports[key])
      .use(
        loggerMiddleware({
          logger: log
        })
      )
      .use(httpEventNormalizer())
      .use(jsonBodyParser())
      .use(validator({ inputSchema: exports[key].schema }))
      .use(cors())
      .use(autoProxyResponse())
      .use(httpErrorHandler())
  })
}

middyExport({
  bulkInsert,
  create,
  list,
  update
})
