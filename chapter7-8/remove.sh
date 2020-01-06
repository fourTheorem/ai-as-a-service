#!/bin/bash

set -e

source services.env

for service in ${SERVICES}; do
  echo ${service} - Removing
  pushd $service
  sls remove
  popd
done
