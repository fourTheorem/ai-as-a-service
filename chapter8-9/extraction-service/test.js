'use strict'

const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const bucketName = '665863320777-dev-item-store'
const path =
  'incoming-texts/https%3A%2F%2Fwww.predictconference.com/https%3A%2F%2Fwww.predictconference.com%2Fspeakers.php/page.txt'

const copyParams = {
  Bucket: bucketName,
  CopySource: '${bucketName}/${path}',
  Key:
    'batches/20190817181117026/https%3A%2F%2Fwww.predictconference.com/https%3A%2F%2Fwww.predictconference.com%2Fspeakers.php/page.txt'
}

s3.getObject({ Bucket: bucketName, Key: path })
  .promise()
  .then(result => console.log('DONE', result.Body.toString()))
  .catch(err => console.error({ err }, 'FAILED'))

/*
s3.copyObject(copyParams) 
  .promise()
  .then(result => console.log({ result }, 'DONE'))
  .catch(err => console.error({ err }, 'FAILED'))
 */
