#!/bin/bash
. ./.env
. checkenv.sh

SERVICES=(frontend resources todo-service note-service schedule-service user-service)

function remove () {
  for SERVICE in "${SERVICES[@]}"
  do
    echo ----------[ removing $SERVICE ]----------
    cd $SERVICE
    serverless remove
    cd ..
  done
}

aws s3 rm s3://${CHAPTER4_BUCKET} --recursive
aws s3 rm s3://${CHAPTER4_DATA_BUCKET} --recursive
. ./cognito.sh teardown

remove

aws dynamodb delete-table --table-name chapter4-todo-dev

