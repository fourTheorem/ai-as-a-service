#!/bin/bash

set -e

source services.env

for service in ${SERVICES}; do
  echo ${service} - Cleaning
  pushd $service
  rm -rf node_modules/
  rm -rf .serverless/
  popd
done
