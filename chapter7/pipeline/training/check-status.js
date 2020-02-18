/*
 * build CSV for model training
 * label,Text of document 1
 */
'use strict'

const AWS = require('aws-sdk')
const comp = new AWS.Comprehend()


comp.listDocumentClassifiers({}, (err, data) => {
  if (err) { return console.log(err) }
  data.DocumentClassifierPropertiesList.forEach(props => {
    console.log(props.DocumentClassifierArn + ' -> ' + props.Status)
  })
})


/*
comp.listDocumentClassificationJobs({}, (err, data) => {
  if (err) { return console.log(err) }
  console.log(data)
})


const params = {
  DocumentClassifierArn: process.env.CHAPTER7_CLASSIFIER_ARN
}
comp.describeDocumentClassifier(params, (err, data) => {
  if (err) { return console.log(err) }
  console.log('status: ' + data.DocumentClassifierProperties.Status)
})
*/

