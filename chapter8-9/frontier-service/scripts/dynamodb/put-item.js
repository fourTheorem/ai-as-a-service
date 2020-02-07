var params = {
  TableName: 'frontier',
  Item: {
    domain: 'fourtheorem.com',
    path: 'about.html',
    status: 'PENDING'
  }
}
docClient.put(params, function(err, data) {
  if (err) ppJson(err)
  // an error occurred
  else ppJson(data) // successful response
})
