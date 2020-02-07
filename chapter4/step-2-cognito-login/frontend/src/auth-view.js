'use strict'

import $ from 'jquery'
import { navBarTpl } from './templates'

const view = { renderLink }
export { view }


function renderLink (isAuth) {
  $('#navbarNav').html(navBarTpl(isAuth))
}

