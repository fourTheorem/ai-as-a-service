'use strict'

import $ from 'jquery'
import { navBarScheduleTpl, errTpl } from './templates'

const view = { renderScheduleButton, renderError }
export { view }


function renderScheduleButton () {
  $('#navbar-list').append(navBarScheduleTpl())
}


function renderError (err) {
  $('#error').innerHTML = errTpl(err)
}

