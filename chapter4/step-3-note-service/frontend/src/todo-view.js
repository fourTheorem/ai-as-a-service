'use strict'

import $ from 'jquery'
import 'webpack-jquery-ui/datepicker'
import { todoListTpl, addTpl, editTpl, errTpl } from './templates'

const view = { renderList, renderAddButton, renderEditArea, renderError }
export { view }


function renderList (body) {
  $('#content').html(todoListTpl(body.Items))
}


function renderAddButton () {
  $('#edit-area').html(addTpl())
}


function renderEditArea (id) {
  $('#edit-area').html(editTpl())
  $('#todo-duedate').datepicker()
  setTimeout(function () {
    $('#todo-duedate').datepicker()
    if (id) {
      $('#todo-id').val(id)
      $('#todo-duedate').val($('#' + id + ' #due-date').text())
      $('#todo-action').val($('#' + id + ' #action').text())
      if ($('#' + id + ' #stat').text() === 'done') {
        $('#todo-stat').prop('checked', true)
      }
      // $('#todo-stat').val($('#' + id + ' #stat').text())
      $('#todo-note').val($('#' + id + ' #note').text())
    }
  }, 100)
}


function renderError (body) {
  $('#error').html(errTpl(body.err))
}

