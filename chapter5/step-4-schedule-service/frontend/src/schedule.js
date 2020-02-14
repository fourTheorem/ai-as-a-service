'use strict'

import $ from 'jquery'
import {view} from './schedule-view'

const schedule = {activate}
export {schedule}

const API_ROOT = `https://chapter4api.${process.env.CHAPTER4_DOMAIN}/schedule/day/`
let itv
let auth


function playSchedule (url) {
  let audio = document.createElement('audio')
  audio.src = url
  audio.play()
}


function pollSchedule (taskId) {
  itv = setInterval(() => {
    auth.session().then(session => {
      $.ajax(API_ROOT + taskId, {
        contentType: 'application/json',
        type: 'GET',
        headers: {
          Authorization: session.idToken.jwtToken
        },
        success: function (body) {
          if (body.taskStatus === 'completed') {
            clearInterval(itv)
            playSchedule(body.signedUrl)
          }
          if (body.taskStatus === 'failed') {
            clearInterval(itv)
            $('#error').innerHTML = 'ERROR: ' + body.err
          }
        }
      })
    }).catch(err => view.renderError(err))
  }, 3000)
}


function buildSchedule (date) {
  const body = {
    date: date
  }

  auth.session().then(session => {
    $.ajax(API_ROOT, {
      data: JSON.stringify(body),
      contentType: 'application/json',
      type: 'POST',
      headers: {
        Authorization: session.idToken.jwtToken
      },
      success: function (body) {
        if (body.stat === 'ok') {
          pollSchedule(body.taskId)
        } else {
          $('#error').innerHTML = body.err
        }
      }
    })
  }).catch(err => view.renderError(err))
}


function bindButton () {
  $('#todo-schedule').unbind('click')
  $('#todo-schedule').on('click', e => {
    buildSchedule()
  })
}


function activate (authObj) {
  auth = authObj
  view.renderScheduleButton()
  bindButton()
}

