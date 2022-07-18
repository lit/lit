/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const httpServer = require('http-server');
const pixelmatch = require('pixelmatch');
const puppeteer = require('puppeteer');
const expect = require('chai').expect;
const PNG = require('pngjs').PNG;
const fs = require('fs');

const generating = process.argv.includes('--generate-screenshots');


describe(generating ? 'Generating screenshots' : 'Screenshots', function() {
  let server, browser, page;

  before(async function() {
    server = httpServer.createServer();
    await server.listen(8080);
  });

  after(async function() {
    await server.close();
  })

  beforeEach(async function() {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterEach(() => browser.close());

  /*
   * Test cases
   */
  describe('lit-virtual', function() {
    beforeEach(async function() {
      await page.goto(`http://127.0.0.1:8080/cases/lit-virtual/`);
      await page.waitForSelector('lit-virtualizer');
    });

    it('displays items', async function() {
      return takeAndCompareScreenshot(page, 'lit-virtual', 'displays-items')
    });

    it('scrolls', async function() {
      await page.evaluate(() => {
        document.querySelector('lit-virtualizer').scrollBy(0, 200);
      });
      return takeAndCompareScreenshot(page, 'lit-virtual', 'scrolls')
    });
  });

  describe('scroll', function() {
    it('displays items', async function() {
      await page.goto(`http://127.0.0.1:8080/cases/scroll/`);
      await page.waitForSelector('#main');
      return takeAndCompareScreenshot(page, 'scroll', 'displays-items')
    });

    it('scrolls', async function() {
      await page.goto(`http://127.0.0.1:8080/cases/scroll/`);
      await page.waitForSelector('#main');
      await page.evaluate(() => {
        document.querySelector('#main').scrollBy(0, 200);
      });
      return takeAndCompareScreenshot(page, 'scroll', 'scrolls')
    });

    it('scrolls to the specified index', async function() {
      await page.goto(`http://127.0.0.1:8080/cases/scroll/?index=100`);
      await page.waitForSelector('#main');
      return takeAndCompareScreenshot(page, 'scroll', 'scrolls-to-the-specified-index')
    });

    it('scrolls to the specified position', async function() {
      await page.goto(`http://127.0.0.1:8080/cases/scroll/?index=100&position=end`);
      await page.waitForSelector('#main');
      return takeAndCompareScreenshot(page, 'scroll', 'scrolls-to-the-specified-position')
    });
  });
});

/*
 * Take a screenshot of the current page and compare it to the expected screenshot.
 */
async function takeAndCompareScreenshot(page, testDir, caseName) {
  let imageType = generating ? 'expected' : 'actual';
  await page.screenshot({path: `./cases/${testDir}/${imageType}.${caseName}.png`});
  if (!generating) {
    return compareScreenshots(testDir, caseName);
  }
}

function compareScreenshots(testDir, caseName) {
  return new Promise((resolve, _) => {
    const img1 = fs.createReadStream(`./cases/${testDir}/actual.${caseName}.png`).pipe(new PNG()).on('parsed', doneReading);
    const img2 = fs.createReadStream(`./cases/${testDir}/expected.${caseName}.png`).pipe(new PNG()).on('parsed', doneReading);

    let filesRead = 0;
    function doneReading() {
      // Wait until both files are read.
      if (++filesRead < 2) return;

      // The files should be the same size.
      expect(img1.width, 'image widths are the same').equal(img2.width);
      expect(img1.height, 'image heights are the same').equal(img2.height);

      // Do the visual diff.
      const diff = new PNG({width: img1.width, height: img2.height});
      const numDiffPixels = pixelmatch(
          img1.data, img2.data, diff.data, img1.width, img1.height,
          {threshold: 0.1});

      // The files should look the same.
      expect(numDiffPixels, 'number of different pixels').equal(0);
      resolve();
    }
  });
}
