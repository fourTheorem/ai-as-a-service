#!/bin/bash

set -e

source services.env

for service in ${SERVICES}; do
  echo ${service} - Preparing
  pushd $service
  echo ${service} - Installing NPM packages
  npm install
  echo ${service} - Deploying service
  sls deploy
  popd
done
