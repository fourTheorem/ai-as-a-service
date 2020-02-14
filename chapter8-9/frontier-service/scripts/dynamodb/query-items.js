// Example 1 - Full Scan
var params = {
  TableName: 'frontier'
}
docClient.scan(params, function(err, data) {
  if (err) ppJson(err)
  // an error occurred
  else ppJson(data) // successful response
})

// Example 2 - Full Status Query
var statusQueryParams = {
  TableName: 'frontier',
  IndexName: 'frontierStatus',
  Limit: 300,
  KeyConditionExpression: '#dom = :domainVal and #sta = :statusVal',
  ExpressionAttributeNames: {
    '#dom': 'domain',
    '#sta': 'status'
  },
  ExpressionAttributeValues: {
    ':domainVal': 'fourtheorem.com',
    ':statusVal': 'IN_PROGRESS'
  }
}
docClient.query(statusQueryParams, function(err, data) {
  if (err) ppJson(err)
  // an error occurred
  else ppJson(data) // successful response
})
