#!/bin/bash

. ../.env
. checkenv.sh

export CHAPTER6_CLASSIFIER_ARN
node ./check-status.js

