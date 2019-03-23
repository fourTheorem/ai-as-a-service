#!/bin/bash
. ./.env
. checkenv.sh

SERVICES=(frontend resources todo-service note-service user-service)

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
. ./cognito.sh teardown

remove

aws dynamodb delete-table --table-name chapter3-todo-dev

