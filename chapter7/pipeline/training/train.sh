#!/bin/bash

. ../.env
. checkenv.sh

export CHAPTER7_PIPELINE_TRAINING_BUCKET
export CHAPTER7_PIPELINE_CLASSIFIER_BUCKET
export CHAPTER7_CLASSIFIER_NAME
export CHAPTER7_DATA_ACCESS_ARN

# TODO: write the classifier arn to the ./env file for downstream use
node ./train-classifier.js

