'use strict'

function urlListItemTpl (item) {
  return `<li class="list-group-item d-flex justify-content-between align-items-center"><a href="#" class="target-url">${item.url}</a><span class="badge badge-primary badge-pill">${item.stat}</span></li>`
}


function imageListItemTpl (bucketRoot, item) {
  let tags = ''
  let imageName = item.image.split('/')
  imageName = imageName[imageName.length - 1]

  item.labels.forEach(label => {
    tags += `<p class="mb-1"><small>${label.Name} (${label.Confidence})</small></p>`
  })

  return `
    <div href="#" class="list-group-item list-group-item-action flex-column align-items-start">
      <div class="d-flex w-100 justify-content-between">
        <img height="100px" src="${bucketRoot}/${item.image}"/>
        <small>${imageName}</small>
      </div>
      ${tags}
    </div>`
}


function imageListTpl (url, list) {
  return `<h2>URL: ${url}</h2>
    <canvas id="word-cloud" width="600" height="400" />
    <div class="list-group">
    ${list}
    </div>`
}

