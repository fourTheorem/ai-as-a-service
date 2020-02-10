'use strict'

import $ from 'jquery'
import 'bootstrap/dist/css/bootstrap.min.css'

import 'webpack-jquery-ui/css'
import Amplify from 'aws-amplify'
import {todo} from './todo'
import {auth} from './auth'
import {schedule} from './schedule'
import {bot} from './bot'


const oauth = {
  domain: process.env.CHAPTER4_COGNITO_DOMAIN,
  scope: ['email'],
  redirectSignIn: `https://s3-${process.env.TARGET_REGION}.amazonaws.com/${process.env.CHAPTER4_BUCKET}/index.html`,
  redirectSignOut: `https://s3-${process.env.TARGET_REGION}.amazonaws.com/${process.env.CHAPTER4_BUCKET}/index.html`,
  responseType: 'token'
}

Amplify.configure({
  Auth: {
    region: process.env.TARGET_REGION,
    userPoolId: process.env.CHAPTER4_POOL_ID,
    userPoolWebClientId: process.env.CHAPTER4_POOL_CLIENT_ID,
    identityPoolId: process.env.CHAPTER4_IDPOOL,
    mandatorySignIn: false,
    oauth: oauth
  },
  Storage: {
    bucket: process.env.CHAPTER4_DATA_BUCKET,
    region: process.env.TARGET_REGION,
    identityPoolId: process.env.CHAPTER4_IDPOOL,
    level: 'public'
  },
  Interactions: {
    bots: {
      todo: {
        name: 'todo',
        alias: '$LATEST',
        region: process.env.TARGET_REGION
      }
    }
  }
})


$(function () {
  auth.activate().then((user) => {
    if (user) {
      todo.activate(auth)
      schedule.activate(auth)
      bot.activate(auth, todo)
    }
  })
})

