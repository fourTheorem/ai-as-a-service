#!/bin/bash

BATCH_ID=$1
if [ "${BATCH_ID}" = "" ]; then
  echo "Usage $0 <BATCH_ID>" > /dev/stderr
  exit -1
fi

source ../.env

OUTFILE=${TMPDIR}/aiaas-batch-${BATCH_ID}

KEY=$(aws s3api list-objects-v2 \
--bucket ${ITEM_STORE_BUCKET} \
--prefix "entity-results/${BATCH_ID}/" \
--query "Contents[?ends_with(Key, 'output.tar.gz')]|[0].Key" \
--output text)

echo Fetching output from ${KEY}

aws s3api get-object --bucket ${ITEM_STORE_BUCKET} --key ${KEY} ${OUTFILE}

# Extract output contained within tarball and print JSON to STDOUT
gunzip -c ${OUTFILE} | tar -O - -xf - output
