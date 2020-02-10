/*
 * configure iam for comprehend
 */

const AWS = require('aws-sdk')
const iam = new AWS.IAM()
const ROLE_NAME = 'c6-comprehend'

const trustPolicy = {
  Version: '2012-10-17',
  Statement: {
    Effect: 'Allow',
    Principal: {'Service': 'comprehend.amazonaws.com'},
    Action: 'sts:AssumeRole'
  }
}

const permissionsPolicy = {
  Version: '2012-10-17',
  Statement: [{
    Action: [ 's3:GetObject' ],
    Resource: [ `arn:aws:s3:::${process.env.CHAPTER7_PIPELINE_TRAINING_BUCKET}/*` ],
    Effect: 'Allow'
  }, {
    Action: [ 's3:ListBucket' ],
    Resource: [ `arn:aws:s3:::${process.env.CHAPTER7_PIPELINE_TRAINING_BUCKET}` ],
    Effect: 'Allow'
  }, {
    Action: [ 's3:ListBucket' ],
    Resource: [ `arn:aws:s3:::${process.env.CHAPTER7_PIPELINE_PROCESSING_BUCKET}` ],
    Effect: 'Allow'
  }, {
    Action: [ 's3:GetObject' ],
    Resource: [ `arn:aws:s3:::${process.env.CHAPTER7_PIPELINE_PROCESSING_BUCKET}/*` ],
    Effect: 'Allow'
  }, {
    Action: [ 's3:PutObject' ],
    Resource: [ `arn:aws:s3:::${process.env.CHAPTER7_PIPELINE_PROCESSING_BUCKET}/*` ],
    Effect: 'Allow'
  }]
}


let params = {
  AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
  RoleName: ROLE_NAME
}
iam.createRole(params, (err, data) => {
  if (err) { return console.log(err) }
  const arn = data.Role.Arn

  params = {
    PolicyDocument: JSON.stringify(permissionsPolicy),
    PolicyName: 'ComprehendS3',
    RoleName: ROLE_NAME
  }
  iam.putRolePolicy(params, (err, data) => {
    if (err) { return console.log(err) }
    console.log(arn)
  })
})

