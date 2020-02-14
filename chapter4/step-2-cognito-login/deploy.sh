#!/bin/bash
. ./.env
. checkenv.sh

SERVICES=(resources frontend user-service)

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

function domain () {
  cd todo-service
  npm install
  serverless create_domain
  cd ..
}

domain
deploy
. ./cognito.sh setup

SERVICES=(todo-service)
deploy

cd frontend
npm run build
aws s3 sync dist/ s3://$CHAPTER4_BUCKET
cd ..

