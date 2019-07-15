'use strict'

const CDP = require('chrome-remote-interface')

const pageLoadTimeout = process.env.PAGE_LOAD_TIMEOUT || 60 * 1000

console.log({ pageLoadTimeout }, 'Using page load timeout')

function load(url) {
  return CDP.New()
    .then(tab => CDP({ host: '127.0.0.1', target: tab }))
    .then(({ Network, Page, Runtime }) =>
      Network.enable()
        .then(() => Network.setUserAgentOverride({
          userAgent: 'Mozilla/5.0 (compatible; AIaaSBookCrawler/1.0; +https://aiasaservicebook.com)'
        }))
        .then(() => Page.enable())
        .then(() => Page.navigate({ url }))
        .then(() => Page.loadEventFired())
        .then(() =>
          Promise.all([
            Runtime.evaluate({
              expression:
                'JSON.stringify([...document.querySelectorAll("a")].map(a => ({ text: a.text, href: a.href })))'
            }),
            Runtime.evaluate({
              expression: 'document.documentElement.outerHTML'
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
            { data: screenshotData }
          ]) => ({
            links: JSON.parse(linksJson).reduce(
              (acc, val) =>
                acc.find(entry => entry.href === val.href)
                  ? acc
                  : [...acc, val],
              []
            ),
            html,
            screenshotData
          })
        )
    )
}

module.exports = {
  load
}
