/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const AWS = require('aws-sdk')

const comp = new AWS.Comprehend()
let cArn = null


const params = {
  DataAccessRoleArn: process.env.CHAPTER7_DATA_ACCESS_ARN,
  DocumentClassifierName: process.env.CHAPTER7_CLASSIFIER_NAME,
  InputDataConfig: {
    S3Uri: `s3://${process.env.CHAPTER7_PIPELINE_TRAINING_BUCKET}`
  },
  LanguageCode: 'en'
}

comp.createDocumentClassifier(params, (err, data) => {
  if (err) { return console.log(err) }
  console.log(JSON.stringify(data, null, 2))
  cArn = data.DocumentClassifierArn
  console.log(cArn)
})

