/* globals alert:false */
'use strict'

import $ from 'jquery'
import {Storage} from 'aws-amplify'
import {AudioControl} from './audio/control'
import uuid from 'uuid/v1'
import {view} from './note-view'

const note = {activate, bindRecord}
export {note}

const API_ROOT = `https://chapter3api.${process.env.CHAPTER3_DOMAIN}/noteapi/note/`
const DATA_BUCKET_ROOT = `https://s3-${process.env.TARGET_REGION}.amazonaws.com/${process.env.CHAPTER3_DATA_BUCKET}/public/`

let auth
let ac
let itv


function pollNote (noteId) {
  let count = 0
  itv = setInterval(() => {
    auth.session().then(session => {
      $.ajax(API_ROOT + noteId, {
        type: 'GET',
        headers: {
          Authorization: session.idToken.jwtToken
        },
        success: function (body) {
          if (body.transcribeStatus === 'COMPLETED') {
            clearInterval(itv)
            view.renderNote(body.results.transcripts[0].transcript)
          } else if (body.transcribeStatus === 'FAILED') {
            clearInterval(itv)
            view.renderNote('FAILED')
          } else {
            count++
            let dots = ''
            for (let idx = 0; idx < count; idx++) {
              dots = dots + '.'
            }
            view.renderNote('Still thinking' + dots)
          }
        }
      })
    }).catch(err => view.renderError(err))
  }, 3000)
}


function submitNote (noteId, recordedSampleRate) {
  const body = {
    noteLang: 'en-US',
    noteUri: DATA_BUCKET_ROOT + noteId + '.wav',
    noteFormat: 'wav',
    noteName: noteId,
    noteSampleRate: recordedSampleRate
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
          pollNote(noteId)
        } else {
          $('#error').html(body.err)
        }
      }
    })
  }).catch(err => view.renderError(err))
}


function startRecord () {
  view.renderNote('Speak')
  ac = AudioControl({checkAudioSupport: false})
  ac.supportsAudio((supported) => {
    if (supported) {
      ac.startRecording()
    } else {
      alert('No audio support!')
    }
  })
}



function stopRecord () {
  const noteId = uuid()

  view.renderNote('Thinking')
  ac.stopRecording()
  ac.exportWAV((blob, recordedSampleRate) => {
    Storage.put(noteId + '.wav', blob)
      .then(result => {
        submitNote(noteId, recordedSampleRate)
      })
      .catch(err => {
        console.log(err)
      })
    ac.close()
  })
}


function bindRecord () {
  $('#todo-note-start').unbind('click')
  $('#todo-note-start').on('click', e => {
    startRecord()
  })
  $('#todo-note-stop').unbind('click')
  $('#todo-note-stop').on('click', e => {
    stopRecord()
  })
}


function activate (authObj) {
  auth = authObj
}

