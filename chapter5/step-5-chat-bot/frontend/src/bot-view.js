'use strict'

const view = {showRequest, showResponse, showError}
export {view}


function showRequest (text) {
  var conversationDiv = document.getElementById('conversation')
  var requestPara = document.createElement('P')
  requestPara.className = 'userRequest'
  requestPara.appendChild(document.createTextNode(text))
  conversationDiv.appendChild(requestPara)
  conversationDiv.scrollTop = conversationDiv.scrollHeight
}


function showError (text) {
  var conversationDiv = document.getElementById('conversation')
  var errorPara = document.createElement('P')
  errorPara.className = 'lexError'
  errorPara.appendChild(document.createTextNode(text))
  conversationDiv.appendChild(errorPara)
  conversationDiv.scrollTop = conversationDiv.scrollHeight
}


function showResponse (lexResponse) {
  var conversationDiv = document.getElementById('conversation')
  var responsePara = document.createElement('P')
  responsePara.className = 'lexResponse'
  if (lexResponse.message) {
    if (lexResponse.inputTranscript) {
      responsePara.appendChild(document.createTextNode(lexResponse.message + ' ' + lexResponse.inputTranscript))
    } else {
      responsePara.appendChild(document.createTextNode(lexResponse.message))
    }
    responsePara.appendChild(document.createElement('br'))
  }
  conversationDiv.appendChild(responsePara)
  conversationDiv.scrollTop = conversationDiv.scrollHeight
}

