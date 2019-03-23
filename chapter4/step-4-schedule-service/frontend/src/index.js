'use strict'

import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'webpack-jquery-ui/css'
import Amplify from 'aws-amplify'
import {todo} from './todo'
import {auth} from './auth'
import {schedule} from './schedule'


const oauth = {
  domain: process.env.CHAPTER3_COGNITO_DOMAIN,
  scope: ['email'],
  redirectSignIn: `https://${process.env.CHAPTER3_BUCKET}.s3.amazonaws.com/index.html`,
  redirectSignOut: `https://${process.env.CHAPTER3_BUCKET}.s3.amazonaws.com/index.html`,
  responseType: 'token'
}

Amplify.configure({
  Auth: {
    region: process.env.TARGET_REGION,
    userPoolId: process.env.CHAPTER3_POOL_ID,
    userPoolWebClientId: process.env.CHAPTER3_POOL_CLIENT_ID,
    identityPoolId: process.env.CHAPTER3_IDPOOL,
    mandatorySignIn: false,
    oauth: oauth
  },
  Storage: {
    bucket: process.env.CHAPTER3_DATA_BUCKET,
    region: process.env.TARGET_REGION,
    identityPoolId: process.env.CHAPTER3_IDPOOL,
    level: 'public'
  }
})


$(function () {
  auth.activate().then((user) => {
    if (user) {
      todo.activate(auth)
      schedule.activate(auth)
    }
  })
})

