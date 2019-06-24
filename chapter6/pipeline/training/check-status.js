/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const AWS = require('aws-sdk')
const comp = new AWS.Comprehend()


const params = {
  DocumentClassifierArn: process.env.CHAPTER6_CLASSIFIER_ARN
}
comp.describeDocumentClassifier(params, (err, data) => {
  if (err) { return console.log(err) }
  console.log('status: ' + data.DocumentClassifierProperties.Status)
})

