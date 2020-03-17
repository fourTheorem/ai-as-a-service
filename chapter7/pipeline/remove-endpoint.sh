#!/bin/bash
. ./.env
. checkenv.sh

aws comprehend delete-endpoint --endpoint-arn ${CHAPTER7_ENDPOINT_ARN}
