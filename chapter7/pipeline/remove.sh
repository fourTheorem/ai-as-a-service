#!/bin/bash
. ./.env
. checkenv.sh

SERVICES=(classify sentiment translate pipeline-api)

function remove () {
  for SERVICE in "${SERVICES[@]}"
  do
    echo ----------[ removing $SERVICE ]----------
    cd $SERVICE
    serverless remove
    cd ..
  done
}

aws s3 rm s3://${CHAPTER7_PIPELINE_PROCESSING_BUCKET} --recursive
aws s3 rm s3://${CHAPTER7_PIPELINE_TRAINING_BUCKET} --recursive
aws comprehend delete-document-classifier --document-classifier-arn ${CHAPTER7_CLASSIFIER_ARN}

export CHAPTER7_DATA_ACCESS_ARN
CHAPTER7_DATA_ACCESS_ROLE_NAME=`node -e "console.log(process.env.CHAPTER7_DATA_ACCESS_ARN.split('/')[1])"`
aws iam delete-role-policy --role-name ${CHAPTER7_DATA_ACCESS_ROLE_NAME} --policy-name ComprehendS3
aws iam delete-role --role-name ${CHAPTER7_DATA_ACCESS_ROLE_NAME}
remove

echo ----------[ removing training bucket ]----------
cd training/resources
serverless remove
cd ..

