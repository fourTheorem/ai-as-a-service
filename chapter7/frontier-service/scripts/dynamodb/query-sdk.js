const AWS = require('aws-sdk')

const dynamoDb = new AWS.DynamoDB()

const statusQueryParams = {
  TableName: 'frontier',
  IndexName: 'frontierStatus',
  Limit: 300,
  KeyConditionExpression: '#dom = :domainVal and #sta = :statusVal',
  ExpressionAttributeNames: {
    '#dom': 'domain',
    '#sta': 'status'
  },
  ExpressionAttributeValues: {
    ':domainVal': {
      S: 'www.fourtheorem.com'
    },
    ':statusVal': {
      S: 'PENDING'
    }
  }
}

dynamoDb.query(statusQueryParams, (err, data) => {
  console[err ? 'error' : 'log']('Done', err, data)
})
