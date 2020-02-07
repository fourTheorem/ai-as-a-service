'use strict'

const CDP = require('chrome-remote-interface')

const pageLoadTimeout = process.env.PAGE_LOAD_TIMEOUT || 60 * 1000

let clientPromise

function initClient() {
  if (!clientPromise) {
    clientPromise = CDP.New().then(tab =>
      CDP({ host: '127.0.0.1', target: tab })
    )
  }
  return clientPromise
}

function load(url) {
  return initClient().then(({ Network, Page, Runtime }) =>
    Network.enable()
      .then(() =>
        Network.setUserAgentOverride({
          userAgent:
            'Mozilla/5.0 (compatible; AIaaSBookCrawler/1.0; +https://aiasaservicebook.com)'
        })
      )
      .then(() => Page.enable())
      .then(() => Page.navigate({ url }))
      .then(() => Page.loadEventFired())
      .then(() => new Promise(resolve => setTimeout(resolve, 5000)))
      .then(() =>
        Promise.all([
          Runtime.evaluate({
            expression: `
JSON.stringify(Object.values([...document.querySelectorAll("a")]
  .filter(a => a.href.startsWith('http'))
  .map(a => ({ text: a.text.trim(), href: a.href }))
  .reduce(function(acc, link) {
    const href = link.href.replace(/#.*$/, '')
    if (!acc[href]) {
        acc[href] = link
    }
    return acc
  }, {})))
`
          }),
          Runtime.evaluate({
            expression: 'document.documentElement.outerHTML'
          }),
          Runtime.evaluate({
            expression: `
function documentText(document) {
  return document.body.innerText + '\\n' +
    [...document.querySelectorAll('iframe')].map(iframe => documentText(iframe.contentDocument)).join('\\n')
}
documentText(document)
`
          }),
          Page.captureScreenshot()
        ])
      )
      .then(
        ([
          {
            result: { value: linksJson }
          },
          {
            result: { value: html }
          },
          {
            result: { value: text }
          },
          { data: screenshotData }
        ]) => ({
          links: JSON.parse(linksJson).reduce(
            (acc, val) =>
              acc.find(entry => entry.href === val.href) ? acc : [...acc, val],
            []
          ),
          html,
          text,
          screenshotData
        })
      )
  )
}

function close() {
  return clientPromise.then(() => client.close())
}

module.exports = {
  load
}
