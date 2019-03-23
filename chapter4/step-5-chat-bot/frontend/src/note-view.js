'use strict'

import $ from 'jquery'

const view = { renderNote, renderError }
export { view }


function renderNote (text) {
  $('#todo-note').text(text)
}


function renderError (err) {
  $('#error').innerHTML = err
}
