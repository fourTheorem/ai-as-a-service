'use strict'

const request = require('request')
const htmlparser = require('htmlparser2')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const uuid = require('uuid/v1')

module.exports = function () {

  function parseImageUrls (html, url) {
    return new Promise(resolve => {
      let urls = []
      const parser = new htmlparser.Parser({
        onopentag: function (name, attribs) {
          if (name === 'img' && attribs && attribs.src) {
            if (/^data:image/i.test(attribs.src)) {
              urls.push({url: attribs.src, id: attribs.id})
            } else if (!/^(f|ht)tps?:\/\//i.test(attribs.src)) {
              if (attribs.src[0] === '/' || url[url.length - 1] === '/') {
                urls.push({url: url + attribs.src, id: attribs.id})
              } else {
                urls.push({url: url + '/' + attribs.src, id: attribs.id})
              }
            } else {
              urls.push({url: attribs.src, id: attribs.id})
            }
          }
        },
        onend: function () {
          resolve(urls)
        }
      }, {decodeEntities: true})
      parser.write(html)
      parser.end()
    })
  }


  function fetchImage (imageUrl, id, domain) {
    return new Promise((resolve, reject) => {
      console.log('fetching: ' + imageUrl)
      request.head(imageUrl, (err, response, body) => {
        console.log('fetching: ' + response)
        if (err || response.statusCode !== 200) { return resolve({url: imageUrl, stat: response.statusCode, err: err}) }

        request({url: imageUrl, encoding: null}, (err, response, buffer) => {
          console.log('fetching: ' + response.statusCode)
          if (err || response.statusCode !== 200) { return resolve({url: imageUrl, stat: response.statusCode, err: err}) }

          const fileName = uuid()
          s3.putObject({Bucket: process.env.BUCKET, Key: domain + '/' + fileName, Body: buffer}, (err, data) => {
            console.log('writing: ' + imageUrl)
            resolve({url: imageUrl, stat: err || 'ok'})
          })
        })
      })
    })
  }


  function decodeImage (imageUrl, id, domain) {
    const spl = imageUrl.split(',')
    const data = spl[1]

    return new Promise((resolve, reject) => {
      let type = /data:image\/(.+);base64/i.exec(spl[0])
      if (type) {
        type = type[1]
        const b = Buffer.from(data, 'base64')

        const fileName = uuid()
        s3.putObject({Bucket: process.env.BUCKET, Key: domain + '/' + fileName, Body: b}, (err, data) => {
          resolve({url: imageUrl, stat: err || 'ok'})
        })
      } else {
        resolve({url: imageUrl, stat: 'unknonwn type'})
      }
    })
  }


  function fetchImages (images, domain) {
    return new Promise((resolve, reject) => {
      let promises = []
      images.forEach(image => {
        if (/^data:image/i.test(image.url)) {
          promises.push(decodeImage(image.url, image.id, domain))
        } else {
          promises.push(fetchImage(image.url, image.id, domain))
        }
      })
      Promise.all(promises).then(values => { resolve(values) })
    })
  }


  return {
    fetchImages,
    parseImageUrls
  }
}

