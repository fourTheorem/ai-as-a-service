#!/bin/bash
. ./.env
. checkenv.sh

SERVICES=(frontend todo-service resources)

function remove () {
  for SERVICE in "${SERVICES[@]}"
  do
    echo ----------[ removing $SERVICE ]----------
    cd $SERVICE
    serverless remove
    cd ..
  done
}

function domain () {
  cd todo-service
  serverless delete_domain
  cd ..
}

domain

aws s3 rm s3://${CHAPTER4_BUCKET} --recursive
aws s3 rm s3://${CHAPTER4_DATA_BUCKET} --recursive
remove

