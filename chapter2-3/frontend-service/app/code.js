/* globals $:false imageListItemTpl:false imageListTpl:false WordCloud:false Chart:false */
'use strict'

// const BUCKET_ROOT = '<YOUR BUCKET URL>' // of the form https://s3-eu-west-1.amazonaws.com/<YOUR BUCKET NAME>
// const API_ROOT = 'https://chapter2api.<YOUR CUSTOM DOMAIN>/api/'
const BUCKET_ROOT = 'https://s3-eu-west-1.amazonaws.com/peterbooktestingfeb2020'
const API_ROOT = 'https://chapter2api.aiasaservice.info/api/'


function displayableUrl (url) {
  let disp = url
  if (disp) {
    const offset = disp.indexOf('?')
    if (offset !== -1) {
      disp = disp.substring(0, offset)
    }
  }
  return disp
}


function renderUrlList () {
  $.getJSON(API_ROOT + 'url/list', function (body) {
    if (body.stat === 'ok') {
      let list = body.details
      let output = '<ul class="list-group" id="url-list">'

      list.forEach(item => {
        const disp = displayableUrl(item.url)
        output += '<li class="list-group-item d-flex justify-content-between align-items-center"><a href="#" class="target-url">' + disp + '</a><span class="badge badge-primary badge-pill">' + item.stat + '</span></li>'
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


function drawHistogram (data) {
  let ctx = document.getElementById('histogram').getContext('2d')
  let labels = []
  let dataPoints = []

  data.details.wordCloudList.forEach(item => {
    if (item[1] > 1) {
      labels.push(item[0])
      dataPoints.push(item[1])
    }
  })
  let chart = new Chart(ctx, {
    type: 'bar',
    data: {
      // labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      labels: labels,
      datasets: [{
        label: 'Label Frequency',
        backgroundColor: 'rgb(0, 99, 132)',
        borderColor: 'rgb(0, 99, 132)',
        data: dataPoints
      }]
    },
    options: {
      responsive: false
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
          if (!item.err) {
            list += imageListItemTpl(BUCKET_ROOT, item)
          }
        })

        const disp = displayableUrl(data.details.url)
        output = imageListTpl(disp, list)
        $('#content').html(output)

        data.details.wordCloudList.forEach(item => {
          if (item[1] > 1) {
            wclist.push(item)
          }
        })

        let options = {
          /*
          gridSize: Math.round(16 * $('#word-cloud').width() / 512),
          weightFactor: function (size) {
            return Math.pow(size, 2.3) * $('#word-cloud').width() / 512
          },
          */
          gridSize: 5,
          weightFactor: 4.5,
          fontFamily: 'Times, serif',
          color: 'random-dark',
          shuffle: false,
          rotateRatio: 0.5,
          list: wclist,
          shrinkToFit: true,
          clearCanvas: true
        }
        WordCloud(document.getElementById('word-cloud'), options)
        drawHistogram(data)
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

