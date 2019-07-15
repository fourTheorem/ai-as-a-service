'use strict'

const awscred = require('awscred')
const seed = 'test-seed'
const signedAxios = require('aws-signed-axios')
const url = 'test-url'

const frontierUrl =
  'https://nwlewaau65.execute-api.eu-west-1.amazonaws.com/dev/frontier-url'
const result = []

awscred.loadCredentialsAndRegion(credentialsLoaded)

function credentialsLoaded(err, credentialData) {
  if (err) {
    console.error({ err }, 'Failed to load credentials')
    process.exit(1)
  }

  signedAxios(
    {
      method: 'PATCH',
      url: `${frontierUrl}/${encodeURIComponent(seed)}/${encodeURIComponent(
        url
      )}`,
      data: result
    },
    credentialData.credentials
  )
    .catch(err => {
      console.error({ data: err.response.data }, 'Error Data')
      throw err
    })
    .then(response => console.log(response))
}
