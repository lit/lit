/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import deoptLogToJson from 'deoptigate/deoptigate.log.js';
const { logToJSON } = deoptLogToJson;
import deoptCreatePage from 'deoptigate/app/lib/create-page.js';
const {createPage} = deoptCreatePage;
import mkdirp from 'mkdirp';
import esDevServer from 'es-dev-server';
const { createConfig, startServer }  = esDevServer;

const generate = async (deoptFolder: string) => {
  const json = await logToJSON(path.join(deoptFolder, 'v8.log'), { root: process.cwd() });
  fs.writeFileSync(path.join(deoptFolder, 'index.html'), createPage(), 'utf8');
  fs.writeFileSync(path.join(deoptFolder, 'deoptigate.render-data.js'), `deoptigateRender(${json});`, 'utf8');
};

export const deoptigateFolderForUrl = (url: string) => {
  return 'deopt-' + url.replace(/\?/, '-').replace(/.html/, '');
}

export const deoptigate = async (outputFolder: string, url: string) => {
  const config = createConfig({
    port: 9999,
    nodeResolve: true,
    // dedupe: true,
    preserveSymlinks: true
  });
  const { server } = await startServer(config);
  const deoptFolder = path.join(process.cwd(), outputFolder, deoptigateFolderForUrl(url));
  mkdirp.sync(deoptFolder);
  const logFile = path.join(deoptFolder, 'v8.pre.log');
  // From https://gist.github.com/billti/a2ee40e60611ec9b37b89c7c00cd39ab
  const browser = await puppeteer.launch({
    userDataDir: '/tmp/deoptigate_user',
    args: [
      `--enable-precise-memory-info`,
      `--no-sandbox`,
      `--disable-extensions`,
      `--js-flags=--trace-ic,--nologfile-per-isolate,--logfile=${logFile}`,
    ]
  });
  console.log(`Profiling ${url}...`);
  const page = await browser.newPage();
  await page.goto(`http://localhost:9999/generated/${url}`);
  await new Promise(r => setTimeout(() => r(), 2000));
  browser.close();
  server.close();
  // From https://gist.github.com/billti/a2ee40e60611ec9b37b89c7c00cd39ab
  let logText = fs.readFileSync(logFile, 'utf8');
  const badLines = /(extensions::SafeBuiltins:)|(v8\/LoadTimes:)|(, :\d)|(code-creation,Script)/;
  const webPrefix = /(?:(?:https?:\/\/[^\/]*\/)|(?:file:\/\/\/[a-zA-Z]:)|(?:file:\/\/))/;
  const badWrap = /(?:\d)code-creation/;
  const processedLogFile = path.join(deoptFolder, 'v8.log');
  fs.writeFileSync(processedLogFile, logText
    .split('\n')
    .filter((line: string) => !badLines.test(line))
    .map((line: string) => line.replace(webPrefix, ''))
    .map((line: string) => line.replace(badWrap, '\ncode-creation'))
    .join('\n'));
  await generate(deoptFolder);
}


