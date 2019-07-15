var params = {
  TableName: 'frontier',
  Key: {
    domain: 'fourtheorem.com',
    path: 'company.html'
  },
  ExpressionAttributeNames: {
    '#sta': 'status'
  },
  UpdateExpression: 'SET #sta = :statusVal',
  ExpressionAttributeValues: {
    ':statusVal': 'CRAWLED'
  }
}

docClient.update(params, function(err, data) {
  if (err) ppJson(err)
  // an error occurred
  else ppJson(data) // successful response
})
