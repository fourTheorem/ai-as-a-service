/* globals Blob:false postMessage:false close:false */
'use strict'

let recLength = 0
let recBuffer = []
let recordSampleRate


self.onmessage = function (e) {
  switch (e.data.command) {
    case 'init':
      init(e.data.config)
      break
    case 'record':
      record(e.data.buffer)
      break
    case 'export':
      exportBuffer(e.data.samplerate)
      break
    case 'clear':
      clear()
      break
    case 'close':
      close()
      break
  }
}


function init (config) {
  recordSampleRate = config.sampleRate
}


function record (inputBuffer) {
  recBuffer.push(inputBuffer[0])
  recLength += inputBuffer[0].length
}


function exportBuffer (exportSampleRate) {
  let mergedBuffers = mergeBuffers(recBuffer, recLength)
  let downsampledBuffer = downsampleBuffer(mergedBuffers, exportSampleRate)
  let encodedWav = encodeWAV(downsampledBuffer)
  let audioBlob = new Blob([encodedWav], {type: 'application/octet-stream'})
  postMessage(audioBlob)
}


function clear () {
  recLength = 0
  recBuffer = []
}


function downsampleBuffer (buffer, exportSampleRate) {
  if (typeof exportSampleRate === 'undefined' || exportSampleRate === recordSampleRate) {
    return buffer
  }
  let sampleRateRatio = recordSampleRate / exportSampleRate
  let newLength = Math.round(buffer.length / sampleRateRatio)
  let result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = accum / count
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}


function mergeBuffers (bufferArray, recLength) {
  let result = new Float32Array(recLength)
  let offset = 0
  for (let i = 0; i < bufferArray.length; i++) {
    result.set(bufferArray[i], offset)
    offset += bufferArray[i].length
  }
  return result
}


function floatTo16BitPCM (output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}


function writeString (view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}


function encodeWAV (samples) {
  let buffer = new ArrayBuffer(44 + samples.length * 2)
  let view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 32 + samples.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, recordSampleRate, true)
  view.setUint32(28, recordSampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)
  floatTo16BitPCM(view, 44, samples)

  return view
}

