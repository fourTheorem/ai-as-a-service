'use strict'

const chromium = require('chrome-aws-lambda')
const log = require('./log')

const pageLoadTimeout = process.env.PAGE_LOAD_TIMEOUT || 60 * 1000

let browserPagePromise

function initBrowser() {
  if (!browserPagePromise) {
    browserPagePromise = chromium.executablePath
      .then(executablePath =>
        chromium.puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          headless: chromium.headless,
          executablePath
        })
      )
      .then(browser => browser.newPage())
      .then(page => {
        page.setUserAgent(
          'Mozilla/5.0 (compatible; AIaaSBookCrawler/1.0; +https://aiasaservicebook.com)'
        )
        return page
      })
  }
  return browserPagePromise
}

function load(url) {
  return initBrowser().then(page =>
    page
      .goto(url)
      .then(() => new Promise(resolve => setTimeout(resolve, 5000)))
      .then(() =>
        Promise.all([
          page.evaluate(`
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
`),
          page.evaluate('document.documentElement.outerHTML'),
          page.evaluate(`
function documentText(document) {
  return document.body.innerText + '\\n' +
    [...document.querySelectorAll('iframe')].map(iframe => documentText(iframe.contentDocument)).join('\\n')
}
documentText(document)
`),
          page.screenshot()
        ]).then(([linksJson, html, text, screenshotData]) => ({
          links: JSON.parse(linksJson).reduce(
            (acc, val) =>
              acc.find(entry => entry.href === val.href) ? acc : [...acc, val],
            []
          ),
          html,
          text,
          screenshotData
        }))
      )
      .finally(() => {
        log.info('Closing page')
        page.close()
      })
  )
}

module.exports = {
  load
}
