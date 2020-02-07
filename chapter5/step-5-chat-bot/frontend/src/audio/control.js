'use strict'

import {AudioRecorder} from './recorder.js'

export {AudioControl}


function AudioControl (options) {
  let recorder
  let audioRecorder
  let checkAudioSupport
  let audioSupported
  let playbackSource
  let UNSUPPORTED = 'Audio is not supported.'
  options = options || {}
  checkAudioSupport = options.checkAudioSupport !== false


  function startRecording (onSilence, visualizer, silenceDetectionConfig) {
    onSilence = onSilence || function () {}
    visualizer = visualizer || function () {}
    audioSupported = audioSupported !== false
    if (!audioSupported) {
      throw new Error(UNSUPPORTED)
    }
    recorder = audioRecorder.createRecorder(silenceDetectionConfig)
    recorder.record(onSilence, visualizer)
  }


  function stopRecording () {
    audioSupported = audioSupported !== false
    if (!audioSupported) {
      throw new Error(UNSUPPORTED)
    }
    recorder.stop()
  }


  function exportWAV (callback, sampleRate) {
    audioSupported = audioSupported !== false
    if (!audioSupported) {
      throw new Error(UNSUPPORTED)
    }
    if (!(callback && typeof callback === 'function')) {
      throw new Error('You must pass a callback function to export.')
    }
    sampleRate = (typeof sampleRate !== 'undefined') ? sampleRate : 16000
    recorder.exportWAV(callback, sampleRate)
    recorder.clear()
  }


  function playHtmlAudioElement (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return
    }
    var myBlob = new Blob([buffer])
    var audio = document.createElement('audio')
    var objectUrl = window.URL.createObjectURL(myBlob)
    audio.src = objectUrl
    audio.addEventListener('ended', function () {
      audio.currentTime = 0
      if (typeof callback === 'function') {
        callback()
      }
    })
    audio.play()
  }


  function play (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return
    }
    var myBlob = new Blob([buffer])
    // We'll use a FileReader to create and ArrayBuffer out of the audio response.
    var fileReader = new FileReader()
    fileReader.onload = function() {
      // Once we have an ArrayBuffer we can create our BufferSource and decode the result as an AudioBuffer.
      playbackSource = audioRecorder.audioContext().createBufferSource()
      audioRecorder.audioContext().decodeAudioData(this.result, function(buf) {
        // Set the source buffer as our new AudioBuffer.
        playbackSource.buffer = buf
        // Set the destination (the actual audio-rendering device--your device's speakers).
        playbackSource.connect(audioRecorder.audioContext().destination)
        // Add an "on ended" callback.
        playbackSource.onended = function(event) {
          if (typeof callback === 'function') {
            callback()
          }
        }
        // Start the playback.
        playbackSource.start(0)
      })
    }
    fileReader.readAsArrayBuffer(myBlob)
  }


  function stop () {
    if (typeof playbackSource === 'undefined') {
      return
    }
    playbackSource.stop()
  }


  function clear () {
    recorder.clear()
  }


  function supportsAudio (callback) {
    callback = callback || function () { }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      audioRecorder = AudioRecorder()
      audioRecorder.requestDevice()
        .then((stream) => {
          audioSupported = true
          callback(audioSupported)
        })
        .catch(() => {
          audioSupported = false
          callback(audioSupported)
        })
    } else {
      audioSupported = false
      callback(audioSupported)
    }
  }


  function close () {
    audioRecorder.close()
  }


  if (checkAudioSupport) {
    supportsAudio()
  }


  return {
    startRecording,
    stopRecording,
    exportWAV,
    play,
    stop,
    clear,
    playHtmlAudioElement,
    supportsAudio,
    close
  }
}

