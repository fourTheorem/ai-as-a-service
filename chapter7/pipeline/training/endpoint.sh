#!/bin/bash

. ../.env
. checkenv.sh

export CHAPTER7_ENDPOINT_NAME
export CHAPTER7_CLASSIFIER_ARN
export CHAPTER7_ENDPOINT_ARN

node ./endpoint.js

