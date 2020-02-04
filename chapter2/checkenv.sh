#!/bin/bash
declare -a vars=(AWS_ACCOUNT_ID AWS_DEFAULT_REGION CHAPTER2_BUCKET CHAPTER2_DOMAIN)

for var_name in "${vars[@]}"
do
  if [ -z "$(eval "echo \$$var_name")" ]; then
    echo "Missing environment variable $var_name. Please set before continuing"
    exit 1
  fi
done

