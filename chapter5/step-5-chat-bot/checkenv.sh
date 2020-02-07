#!/bin/bash
declare -a vars=(AWS_ACCOUNT_ID AWS_DEFAULT_REGION CHAPTER3_BUCKET CHAPTER3_DATA_BUCKET CHAPTER3_DOMAIN CHAPTER3_COGNITO_BASE_DOMAIN)

for var_name in "${vars[@]}"
do
  if [ -z "$(eval "echo \$$var_name")" ]; then
    echo "Missing environment variable $var_name. Please set before continuing"
    exit 1
  fi
done

