/* globals alert:false */
'use strict'

import $ from 'jquery'
import * as LexRuntime from 'aws-sdk/clients/lexruntime'
import {AudioControl} from './audio/control'
import moment from 'moment'
import {view} from './bot-view'

const bot = {activate}
export {bot}

let ac
let auth
let todo
let lexruntime
let lexUserId = 'chatbot-demo' + Date.now()
let sessionAttributes = {}
let recording = false


function pushChat () {
  var chatInput = document.getElementById('chat-input')

  if (chatInput && chatInput.value && chatInput.value.trim().length > 0) {

    var input = chatInput.value.trim()
    chatInput.value = '...'
    chatInput.locked = true

    var params = {
      botAlias: '$LATEST',
      botName: 'todo',
      inputText: input,
      userId: lexUserId,
      sessionAttributes: sessionAttributes
    }

    view.showRequest(input)
    lexruntime.postText(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        view.showError('Error:  ' + err.message + ' (see console for details)')
      }
      if (data) {
        sessionAttributes = data.sessionAttributes
        if (data.dialogState === 'ReadyForFulfillment') {
          todo.createTodo({
            id: '',
            note: '',
            dueDate: moment(data.slots.dueDate).format('MM/DD/YYYY'),
            action: data.slots.action,
            stat: 'open'
          }, function () {})
        }
        view.showResponse(data)
      }
      chatInput.value = ''
      chatInput.locked = false
    })
  }
  return false
}


function playResponse (buffer, cb) {
  var blob = new Blob([buffer], { type: 'audio/mpeg' })
  var audio = document.createElement('audio')
  var objectUrl = window.URL.createObjectURL(blob)

  audio.src = objectUrl
  audio.addEventListener('ended', function () {
    audio.currentTime = 0
    cb && cb()
  })
  audio.play()
}

/*
function playBlob (blob) {
  var audio = document.createElement('audio')
  var objectUrl = window.URL.createObjectURL(blob)

  audio.src = objectUrl
  audio.addEventListener('ended', function () {
    audio.currentTime = 0
  })
  audio.play()
}
*/


function pushVoice (blob) {
  var chatInput = document.getElementById('chat-input')

  var params = {
    botAlias: '$LATEST',
    botName: 'todo',
    contentType: 'audio/l16; rate=16000; channels=1',
    accept: 'audio/mpeg',
    userId: lexUserId,
    sessionAttributes: sessionAttributes
  }

  params.inputStream = blob
  lexruntime.postContent(params, function (err, data) {
    if (err) {
      console.log(err, err.stack)
      view.showError('Error:  ' + err.message + ' (see console for details)')
    }
    if (data) {
      if (data.audioStream) {
        playResponse(data.audioStream, () => {
        })
      }

      sessionAttributes = data.sessionAttributes
      if (data.dialogState === 'ReadyForFulfillment') {
        todo.createTodo({
          id: '',
          note: '',
          dueDate: moment(data.slots.dueDate).format('MM/DD/YYYY'),
          action: data.slots.action,
          stat: 'open'
        }, function () {})
      }
      view.showResponse(data)
    }
    chatInput.value = ''
    chatInput.locked = false
  })
  return false
}


function startRecord () {
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
  ac.stopRecording()
  ac.exportWAV((blob, recordedSampleRate) => {
    pushVoice(blob)
    ac.close()
  })
}


function bindRecord () {
  $('#microphone').unbind('click')
  $('#microphone').on('click', e => {
    if (!recording) {
      recording = true
      $('#microphone').html('<img src="assets/images/micon.png" width="20px" alt="mic" class="float-left">')
      startRecord()
    } else {
      recording = false
      $('#microphone').html('<img src="assets/images/micoff.png" width="20px" alt="mic" class="float-left">')
      stopRecord()
    }
  })
}


function activate (authObj, todoObj) {
  auth = authObj
  todo = todoObj
  auth.credentials().then(creds => {
    lexruntime = new LexRuntime({region: process.env.TARGET_REGION, credentials: creds})

    $('#chat-input').keypress(function (e) {
      if (e.which === 13) {
        pushChat()
        e.preventDefault()
        return false
      }
    })

    bindRecord()
  })
}

