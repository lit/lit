/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import parseChangelog from 'changelog-parser';
import commandLineArgs from 'command-line-args';
import {marked} from 'marked';
import puppeteer from 'puppeteer';
import {readFile} from 'fs/promises';
import path from 'path';

const optionDefinitions = [
  {name: 'file', type: String, defaultOption: true},
  {name: 'version', type: String},
];

export const run = async () => {
  const options = commandLineArgs(optionDefinitions);

  if (!options.file) {
    console.error(
      `
USAGE
    release-image CHANGELOG_PATH [--version VERSION]

EXAMPLES
    To generate the release image for the reactive-element package:

        release-image packages/reactive-element/CHANGELOG.md
          `.trim()
    );
    process.exit(1);
  }
  const filename: string = options.file;
  const version: string = options.version;

  const packageJson = JSON.parse(
    await readFile(path.join(path.dirname(filename), 'package.json'), {
      encoding: 'utf-8',
    })
  );
  const packageName = packageJson.name;

  console.log(`Reading ${packageName} release ${version} from ${filename}`);
  const changelog = (await parseChangelog({
    filePath: filename,
    removeMarkdown: false,
  })) as Changelog;
  const release = await getRelease(changelog, version);
  if (release === undefined) {
    throw new Error('no release found');
  }
  const body = marked(release.body);
  // colors taken from https://github.com/dracula/dracula-theme
  const html = `
     <!doctype html>
     <html>
       <head>
         <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400|Roboto+Mono:300|Roboto+Slab:400,700&display=swap" rel="stylesheet">
         <style>
           body {
             font-family: 'Open Sans', sans-serif;
             font-weight: 300;
             background: #282a36;
             color: #f8f8f2;
             margin: 1.5em;
           }
           h1, h2, h3 {
             font-family: 'Roboto Slab', serif;
             color: #ff79c6;
             font-weight: 400;
           }
           span.name {
             color: #8be9fd;
           }
           code {
             font-family: 'Roboto Mono', monospace;
             font-size: 14px;
             background: #44475a;
             border-radius: 3px;
             padding: 0 4px;
           }
           a {
             color: inherit;
             text-decoration: none;
           }
         </style>
       </head>
       <body>
         <h2><span class="name">${packageName}</span> ${release.title}</h2>
         ${body}
       </body>
     </html>
   `;
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({width: 800, height: 800, deviceScaleFactor: 2});
  await page.setContent(html);
  await page.evaluate(`document.fonts.ready`);
  const bounds = (await page.evaluate(`
     document.documentElement.getBoundingClientRect().toJSON()
   `)) as DOMRect;
  const imageFileName = `${path.basename(packageName)}-${release.title}.png`;
  await page.screenshot({
    path: imageFileName,
    encoding: 'binary',
    type: 'png',
    clip: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
  });
  console.log(`Wrote screenshot to '${imageFileName}'`);
  await browser.close();
  process.exit();
};

const latestVersion = {};

const getRelease = async (
  changelog: Changelog,
  version: string | undefined | typeof latestVersion = latestVersion
): Promise<Release | undefined> => {
  return changelog.versions.find(
    (r) =>
      (r.version !== null && version === latestVersion) ||
      r.version === version ||
      (r.version === null && version === undefined)
  );
};

interface Release {
  version: string | null;
  title: string;
  date: string | null;
  body: string;
  parsed: {
    _: string[];
    [heading: string]: string[];
  };
}

interface Changelog {
  title: string;
  description: string;
  versions: Array<Release>;
}
