'use strict'

import $ from 'jquery'
import {view} from './auth-view'
import {Auth} from 'aws-amplify'

const auth = {activate, user, session, credentials}
export {auth, user}


function bindLinks () {
  $('#logout').unbind('click')
  $('#logout').on('click', e => {
    Auth.signOut().catch(() => {})
  })
  $('#login').unbind('click')
  $('#login').on('click', e => {
    const config = Auth.configure()
    const { domain, redirectSignIn, responseType } = config.oauth
    const clientId = config.userPoolWebClientId
    const url = 'https://' + domain + '/login?redirect_uri=' + redirectSignIn + '&response_type=' + responseType + '&client_id=' + clientId
    window.location.assign(url)
  })
}


function user () {
  return Auth.currentAuthenticatedUser()
}


function session () {
  return Auth.currentSession()
}


function credentials () {
  return Auth.currentUserCredentials()
}


function activate () {
  return new Promise((resolve, reject) => {
    Auth.currentAuthenticatedUser()
      .then(user => {
        view.renderLink(true)
        bindLinks()
        resolve(user)
      })
      .catch(() => {
        view.renderLink(false)
        bindLinks()
        resolve(null)
      })
  })
}

