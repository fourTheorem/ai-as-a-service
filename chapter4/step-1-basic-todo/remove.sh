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

aws s3 rm s3://${CHAPTER3_BUCKET} --recursive
aws s3 rm s3://${CHAPTER3_DATA_BUCKET} --recursive
remove

