#!/bin/bash

. ../.env
. checkenv.sh

export CHAPTER6_PIPELINE_TRAINING_BUCKET
export CHAPTER6_PIPELINE_CLASSIFIER_BUCKET
export CHAPTER6_CLASSIFIER_NAME
export CHAPTER6_DATA_ACCESS_ARN

# TODO: write the classifier arn to the ./env file for downstream use
node ./train-classifier.js

