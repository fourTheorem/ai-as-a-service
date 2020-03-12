/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const AWS = require('aws-sdk')
const comp = new AWS.Comprehend()


var params = {
//  DesiredInferenceUnits: 10,
  DesiredInferenceUnits: 1,
  EndpointName: process.env.CHAPTER7_ENDPOINT_NAME,
  ModelArn: process.env.CHAPTER7_CLASSIFIER_ARN,
  Tags: [{
    Key: 'department',
    Value: 'book'
  }]
}

comp.createEndpoint(params, (err, data) => {
  console.log(err)
  console.log(data)
})

/*
var params = {
  EndpointArn: process.env.CHAPTER7_ENDPOINT_ARN
}

comp.deleteEndpoint(params, (err, data) => {
  console.log(err)
  console.log(data)
})
*/
