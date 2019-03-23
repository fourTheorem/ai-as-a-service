'use strict'

import $ from 'jquery'
import {view} from './todo-view'


const todo = {activate}
export {todo}

const API_ROOT = `https://chapter3api.${process.env.CHAPTER3_DOMAIN}/api/todo/`


function gather () {
  return {
    id: $('#todo-id').val(),
    dueDate: $('#todo-duedate').val(),
    action: $('#todo-action').val(),
    stat: $('#todo-stat').is(':checked') ? 'done' : 'open',
    note: $('#todo-note').val()
  }
}


function create (cb) {
  $.ajax(API_ROOT, {
    data: JSON.stringify(gather()),
    contentType: 'application/json',
    type: 'POST',
    success: function (body) {
      if (body.stat === 'ok') {
        list(cb)
      } else {
        $('#error').html(body.err)
        cb && cb()
      }
    }
  })
}


function update (cb) {
  $.ajax(API_ROOT + $('#todo-id').val(), {
    data: JSON.stringify(gather()),
    contentType: 'application/json',
    type: 'PUT',
    success: function (body) {
      if (body.stat === 'ok') {
        list(cb)
      } else {
        $('#error').html(body.err)
        cb && cb()
      }
    }
  })
}


function del (id) {
  $.ajax(API_ROOT + id, {
    type: 'DELETE',
    success: function (body) {
      if (body.stat === 'ok') {
        list()
      } else {
        $('#error').html(body.err)
      }
    }
  })
}


function list (cb) {
  $.get(API_ROOT, function (body) {
    if (body.stat === 'ok') {
      view.renderList(body)
    } else {
      view.renderError(body)
    }
    cb && cb()
  })
}


function bindList () {
  $('.todo-item-edit').unbind('click')
  $('.todo-item-edit').on('click', (e) => {
    view.renderEditArea(e.currentTarget.id)
  })
  $('.todo-item-delete').unbind('click')
  $('.todo-item-delete').on('click', (e) => {
    del(e.currentTarget.id)
  })
}


function bindEdit () {
  $('#input-todo').unbind('click')
  $('#input-todo').on('click', e => {
    e.preventDefault()
    view.renderEditArea()
  })
  $('#todo-save').unbind('click')
  $('#todo-save').on('click', e => {
    e.preventDefault()
    if ($('#todo-id').val().length > 0) {
      update(() => {
        view.renderAddButton()
      })
    } else {
      create(() => {
        view.renderAddButton()
      })
    }
  })
  $('#todo-cancel').unbind('click')
  $('#todo-cancel').on('click', e => {
    e.preventDefault()
    view.renderAddButton()
  })
}


function activate () {
  list(() => {
    bindList()
    bindEdit()
  })
  $('#content').bind('DOMSubtreeModified', () => {
    bindList()
    bindEdit()
  })
}

