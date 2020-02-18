#!/bin/bash
declare -a vars=(TARGET_REGION AWS_ACCOUNT_ID AWS_DEFAULT_REGION CHAPTER7_PIPELINE_TRAINING_BUCKET CHAPTER7_PIPELINE_PROCESSING_BUCKET)

for var_name in "${vars[@]}"
do
  if [ -z "$(eval "echo \$$var_name")" ]; then
    echo "Missing environment variable $var_name. Please set before continuing"
    exit 1
  fi
done

