'use strict'

import $ from 'jquery'

const view = { renderNote }
export { view }


function renderNote (text) {
  $('#todo-note').text(text)
}
