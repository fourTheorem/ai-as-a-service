#!/bin/bash

. ../.env
. checkenv.sh

export CHAPTER7_CLASSIFIER_ARN
node ./check-status.js

