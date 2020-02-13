/* globals $:false imageListItemTpl:false imageListTpl:false WordCloud:false */
'use strict'

const BUCKET_ROOT = '<YOUR BUCKET URL>'
const API_ROOT = 'https://chapter2api.<YOUR CUSTOM DOMAIN>/api/'


function renderUrlList () {
  $.getJSON(API_ROOT + 'url/list', function (body) {
    if (body.stat === 'ok') {
      let list = body.details
      let output = '<ul class="list-group" id="url-list">'

      list.forEach(item => {
        output += '<li class="list-group-item d-flex justify-content-between align-items-center"><a href="#" class="target-url">' + item.url + '</a><span class="badge badge-primary badge-pill">' + item.stat + '</span></li>'
      })
      output += '</ul>'
      $('#content').html(output)

      $('#url-list li .target-url').on('click', function (e) {
        e.preventDefault()
        renderUrlDetail(this.innerHTML)
      })
    } else {
      $('#content').html(body.details)
    }
  })
}


function renderUrlDetail (url) {
  let list = ''
  let output = ''
  let wclist = []

  $.getJSON(API_ROOT + 'image/list?url=' + url, function (data) {
    if (data.stat === 'ok') {
      if (data.details && data.details.stat === 'analyzed') {
        data.details.analysisResults.forEach(item => {
          list += imageListItemTpl(BUCKET_ROOT, item)
        })
        output = imageListTpl(data.details.url, list)
        $('#content').html(output)

        data.details.wordCloudList.forEach(item => {
          if (item[1] > 1) {
            wclist.push(item)
          }
        })

        let options = {
          gridSize: Math.round(16 * $('#word-cloud').width() / 512),
          weightFactor: function (size) {
            return Math.pow(size, 2.3) * $('#word-cloud').width() / 512
          },
          fontFamily: 'Times, serif',
          color: 'random-light',
          shuffle: false,
          rotateRatio: 0.5,
          list: wclist,
          clearCanvas: true
        }

        WordCloud(document.getElementById('word-cloud'), options)
      } else {
        $('#content').html('Awaiting analysis!!')
      }
    } else {
      $('#content').html('ERROR!! ' + data.stat)
    }
  })
}


$(function () {
  renderUrlList()

  $('#submit-url-button').on('click', function (e) {
    e.preventDefault()
    $.ajax({url: API_ROOT + 'url/analyze',
      type: 'post',
      data: JSON.stringify({url: $('#target-url').val()}),
      dataType: 'json',
      contentType: 'application/json',
      success: (data, stat) => {
      }
    })
  })
})

