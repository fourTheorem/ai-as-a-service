'use strict'

import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'webpack-jquery-ui/css'
import Amplify from 'aws-amplify'
import {todo} from './todo'
import {auth} from './auth'


const oauth = {
  domain: process.env.CHAPTER3_COGNITO_DOMAIN,
  scope: ['email'],
  redirectSignIn: `https://s3-${process.env.TARGET_REGION}.amazonaws.com/${process.env.CHAPTER3_BUCKET}/index.html`,
  redirectSignOut: `https://s3-${process.env.TARGET_REGION}.amazonaws.com/${process.env.CHAPTER3_BUCKET}/index.html`,
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
  }
})


$(function () {
  auth.activate().then((user) => {
    if (user) {
      todo.activate(auth)
    }
  })
})

