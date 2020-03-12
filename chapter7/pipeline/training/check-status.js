/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const AWS = require('aws-sdk')
const comp = new AWS.Comprehend()


function listClassifiers (cb) {
  comp.listDocumentClassifiers({}, (err, data) => {
    if (err) { return console.log(err) }
    data.DocumentClassifierPropertiesList.forEach(props => {
      console.log(props.DocumentClassifierArn + ' -> ' + props.Status)
    })
    cb()
  })
}


function listEndpoints (cb) {
  comp.listEndpoints({}, (err, data) => {
    if (err) { return console.log(err) }
    data.EndpointPropertiesList.forEach(props => {
      console.log(props.EndpointArn + ' -> ' + props.Status)
    })
    cb()
  })
}


listClassifiers(() => {
  listEndpoints(function () {})
})
