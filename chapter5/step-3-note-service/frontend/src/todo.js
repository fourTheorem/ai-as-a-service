'use strict'

import $ from 'jquery'
import {view} from './todo-view'
import {note} from './note'

const todo = {activate}
export {todo}

const API_ROOT = `https://chapter4api.${process.env.CHAPTER4_DOMAIN}/api/todo/`

let auth


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
  auth.session().then(session => {
    $.ajax(API_ROOT, {
      data: JSON.stringify(gather()),
      contentType: 'application/json',
      type: 'POST',
      headers: {
        Authorization: session.idToken.jwtToken
      },
      success: function (body) {
        if (body.stat === 'ok') {
          list(cb)
        } else {
          $('#error').html(body.err)
          cb && cb()
        }
      }
    })
  }).catch(err => view.renderError(err))
}


function update (cb) {
  auth.session().then(session => {
    $.ajax(API_ROOT + $('#todo-id').val(), {
      data: JSON.stringify(gather()),
      contentType: 'application/json',
      type: 'PUT',
      headers: {
        Authorization: session.idToken.jwtToken
      },
      success: function (body) {
        if (body.stat === 'ok') {
          list(cb)
        } else {
          $('#error').html(body.err)
          cb && cb()
        }
      }
    })
  }).catch(err => view.renderError(err))
}


function del (id) {
  auth.session().then(session => {
    $.ajax(API_ROOT + id, {
      type: 'DELETE',
      headers: {
        Authorization: session.idToken.jwtToken
      },
      success: function (body) {
        if (body.stat === 'ok') {
          list()
        } else {
          $('#error').html(body.err)
        }
      }
    })
  }).catch(err => view.renderError(err))
}


function list (cb) {
  auth.session().then(session => {
    $.ajax(API_ROOT, {
      type: 'GET',
      headers: {
        Authorization: session.idToken.jwtToken
      },
      success: function (body) {
        if (body.stat === 'ok') {
          view.renderList(body)
        } else {
          view.renderError(body)
        }
        cb && cb()
      }
    })
  }).catch(err => view.renderError(err))
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
  note.bindRecord()
}


function activate (authObj) {
  auth = authObj
  note.activate(authObj)
  list(() => {
    bindList()
    bindEdit()
  })
  $('#content').bind('DOMSubtreeModified', () => {
    bindList()
    bindEdit()
  })
}

