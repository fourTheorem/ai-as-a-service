#!/usr/bin/env node

'use strict'

const seed = process.argv[2]
console.log('argv', process.argv.join(', '))
if (!seed) {
  console.error(`Usage:\n\t${process.argv[1]} SEED_URL\n`)
  process.exit(-1)
}

const fs = require('fs')
const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()

const params = {
  TableName: 'devFrontier',
  IndexName: 'devFrontierStatus',
  Limit: 1000,
  KeyConditionExpression: '#seed = :seedVal and #status = :statusVal',
  ExpressionAttributeNames: {
    '#seed': 'seed',
    '#status': 'status'
  },
  ExpressionAttributeValues: {
    ':seedVal': seed,
    ':statusVal': 'EXTRACTED'
  }
}

const filePath = `${seed.replace(/[^\w]+/g, '-')}.csv`

docClient
  .query(params)
  .promise()
  .catch(console.error)
  .then(processResults)

function processResults(results) {
  const summaries = {}
  console.log('Writing to', filePath)
  fs.writeFileSync(filePath, `TYPE, TEXT, SCORE, OCCURRENCES\n`)
  results.Items.forEach(
    ({ seed, url, referrer, depth, label, createdAt, entities }) => {
      Object.keys(entities).forEach(entityType => {
        entities[entityType].forEach(entity => {
          const entityKey = `${entityType}, "${entity.text.replace(
            /\n/g,
            ' '
          )}"`
          let entitySummary = summaries[entityKey]
          if (!entitySummary) {
            entitySummary = { count: 1, avgScore: entity.score }
            summaries[entityKey] = entitySummary
          } else {
            const newScore =
              (entitySummary.avgScore * entitySummary.count + entity.score) /
              (entitySummary.count + 1)
            Object.assign(entitySummary, {
              count: entitySummary.count + 1,
              avgScore: newScore
            })
          }
        })
      })
    }
  )

  Object.keys(summaries)
    .sort()
    .forEach(key => {
      const summary = summaries[key]
      fs.appendFileSync(
        filePath,
        `${key}, ${summary.avgScore}, ${summary.count}\n`
      )
    })
}
