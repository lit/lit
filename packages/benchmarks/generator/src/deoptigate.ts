/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import deoptLogToJson from 'deoptigate/deoptigate.log.js';
const {logToJSON} = deoptLogToJson;
import createPage from 'deoptigate/app/lib/create-page.js';
import mkdirp from 'mkdirp';
import {DevServerConfig, startDevServer} from '@web/dev-server';
import childProcess from 'child_process';

const generate = async (deoptFolder: string) => {
  const json = await logToJSON(path.join(deoptFolder, 'v8.log'), {
    root: process.cwd(),
  });
  const file = path.join(deoptFolder, 'index.html');
  fs.writeFileSync(file, createPage(), 'utf8');
  fs.writeFileSync(
    path.join(deoptFolder, 'deoptigate.render-data.js'),
    `deoptigateRender(${json});`,
    'utf8'
  );
  return file;
};

export const deoptigateFolderForUrl = (url: string) => {
  return 'deopt/' + url.replace(/\?/, '-').replace(/\.html[^/]*$/, '');
};

export const deoptigate = async (
  outputFolder: string,
  url: string,
  open = false
) => {
  const config: DevServerConfig = {
    port: 9999,
    nodeResolve: true,
    // dedupe: true,
    preserveSymlinks: true,
  };
  const {server} = await startDevServer({config});
  if (!server) {
    throw new Error(`Server did not start`);
  }
  const deoptFolder = path.join(
    process.cwd(),
    outputFolder,
    deoptigateFolderForUrl(url)
  );
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
    ],
  });
  console.log(`Profiling ${url}...`);
  const page = await browser.newPage();
  await page.goto(`http://localhost:9999/${url}`);
  await new Promise<void>((r) => setTimeout(() => r(), 2000));
  browser.close();
  // From https://gist.github.com/billti/a2ee40e60611ec9b37b89c7c00cd39ab
  const logText = fs.readFileSync(logFile, 'utf8');
  const badLines =
    /(extensions::SafeBuiltins:)|(v8\/LoadTimes:)|(, :\d)|(code-creation,Script)/;
  const webPrefix =
    /(?:(?:https?:\/\/[^/]*\/)|(?:file:\/\/\/[a-zA-Z]:)|(?:file:\/\/))/;
  const badWrap = /(?:\d)code-creation/;
  const processedLogFile = path.join(deoptFolder, 'v8.log');
  fs.writeFileSync(
    processedLogFile,
    logText
      .split('\n')
      .filter((line: string) => !badLines.test(line))
      .map((line: string) => line.replace(webPrefix, ''))
      .map((line: string) => line.replace(badWrap, '\ncode-creation'))
      .join('\n')
  );
  const report = await generate(deoptFolder);
  if (open) {
    const reportURL = path.relative(process.cwd(), report);
    console.log('Opening report... press ^C to stop server and close.');
    childProcess.exec(
      `open -n -a "Google Chrome" http://localhost:9999/${reportURL}`
    );
  } else {
    server.close();
  }
};
