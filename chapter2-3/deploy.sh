#!/bin/bash
. checkenv.sh

SERVICES=(resources crawler-service analysis-service ui-service)

function deploy () {
  for SERVICE in "${SERVICES[@]}"
  do
    echo ----------[ deploying $SERVICE ]----------
    cd $SERVICE
    if [ -f package.json ]; then
      npm install
    fi
    serverless deploy
    cd ..
  done
}

deploy

cd frontend-service
aws s3 sync app/ s3://$CHAPTER2_BUCKET
cd ..

