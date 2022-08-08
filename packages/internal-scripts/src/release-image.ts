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
import {existsSync, readFileSync} from 'fs';

const optionDefinitions = [
  {
    name: 'files',
    alias: 'f',
    type: String,
    defaultOption: true,
    multiple: true,
  },
  {name: 'versions', alias: 'v', type: String, multiple: true},
  {name: 'markdownFile', alias: 'm', type: String},
];

interface CliOptions {
  files?: string[];
  versions?: string[];
  markdownFile?: string;
}

/**
 * A cache of the parsed changelogs such that a package may be referenced
 * multiple times to render multiple versions.
 */
const CHANGELOG_CACHE = new Map<string, Changelog>();

export const run = async () => {
  const options = commandLineArgs(optionDefinitions) as CliOptions;

  if (options.markdownFile && options.files) {
    exitWithUsageError();
  }

  if (options.markdownFile) {
    if (!existsSync(options.markdownFile)) {
      console.error(
        `Could not find markdown file at path: '${options.markdownFile}'`
      );
      process.exit(1);
    }
    const contents = readFileSync(options.markdownFile, {encoding: 'utf-8'});
    await generateReleaseImage(marked(contents));
    process.exit();
  }

  if (
    !options.files ||
    !Array.isArray(options.files) ||
    (Array.isArray(options.versions) &&
      options.versions.length !== options.files.length)
  ) {
    exitWithUsageError();
  }

  const releasesToRender: Release[] = [];
  for (let i = 0; i < options.files.length; i++) {
    const filename: string = options.files[i];
    const version: string = (options.versions ?? [])[i];
    let changelog = CHANGELOG_CACHE.get(filename);
    if (!changelog) {
      const packageJson = JSON.parse(
        await readFile(path.join(path.dirname(filename), 'package.json'), {
          encoding: 'utf-8',
        })
      );
      const packageName = packageJson.name as string;

      console.log(
        `Reading ${packageName} release ${version ?? 'latest'} from ${filename}`
      );
      changelog = (await parseChangelog({
        filePath: filename,
        removeMarkdown: false,
      })) as Changelog;
      changelog.packageName = packageName;
      CHANGELOG_CACHE.set(filename, changelog);
    }
    const release = await getRelease(changelog, version);
    if (release === undefined) {
      throw new Error('no release found');
    }
    // Fix the release fields since our CHANGELOG files result in `title`
    // containing the version number.
    release.version = release.title;
    release.title = changelog.packageName;
    releasesToRender.push(release);
  }
  await generateReleaseImage(
    releasesToRender
      .map(
        ({title, body, version}) =>
          `<h2><span class="name">${title}</span> ${version}</h2>
       ${marked(body)}`
      )
      .join('')
  );
  process.exit();
};

/**
 * Takes contents and generates an image.
 */
async function generateReleaseImage(contents: string) {
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
         ${contents}
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
  const imageFileName = `release.png`;
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
}

function exitWithUsageError(): never {
  console.error(
    `
USAGE
  release-image CHANGELOG_PATH
  release-image (-f CHANGELOG_PATH [-v VERSION])...
  release-image --markdownFile MARKDOWN_PATH

EXAMPLES
  To generate the release image for the reactive-element package:

      release-image packages/reactive-element/CHANGELOG.md

  For multiple packages in a single image:

      release-image reactive-element/CHANGELOG.md lit-html/CHANGELOG.md

  To generate an image composed of specific version numbers, including
  multiple versions of the same package:

      release-image -f reactive-element/CHANGELOG.md -v 3.2.0 \\
                    -f lit-html/CHANGELOG.md -v 2.0.1 \\
                    -f lit-html/CHANGELOG.md -v 2.0.0

  To pass arbitrary contents into the image <body>, use the --markdownFile
  option (or -m):

      release-image -m releaseContents.md

        `.trim()
  );
  process.exit(1);
}

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
  /** Name of the package, taken from package.json */
  packageName: string;
  /** parseChangelog populates this with "Change Log" */
  title: string;
  description: string;
  versions: Array<Release>;
}
