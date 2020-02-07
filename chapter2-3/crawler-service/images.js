'use strict'
/*
  src="data:image/jpeg;base64,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">
  carry  through img.id use for name
*/

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
              if (attribs.src[0] === '/') {
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
      request.head(imageUrl, (err, response, body) => {
        if (err || response.statusCode !== 200) { return resolve({url: imageUrl, stat: err}) }

        request({url: imageUrl, encoding: null}, (err, response, buffer) => {
          if (err || response.statusCode !== 200) { return resolve({url: imageUrl, stat: err}) }

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

