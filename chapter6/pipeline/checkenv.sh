#!/bin/bash
declare -a vars=(AWS_ACCOUNT_ID AWS_DEFAULT_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY CHAPTER6_PIPELINE_TRAINING_BUCKET CHAPTER6_PIPELINE_PROCESSING_BUCKET CHAPTER6_DATA_ACCESS_ARN)

for var_name in "${vars[@]}"
do
  if [ -z "$(eval "echo \$$var_name")" ]; then
    echo "Missing environment variable $var_name. Please set before continuing"
    exit 1
  fi
done

