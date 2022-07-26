/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as process from 'process';
import * as https from 'https';

/**
 * Take the `pullRequestNumber` output of the `changesets/action` GitHub action
 * on standard input and return the CHANGELOG from the PR description in stdout.
 *
 * https://github.com/changesets/action#outputs
 */

const pullRequestNumber = process.argv[2];
if (!pullRequestNumber || isNaN(parseInt(pullRequestNumber, 10))) {
  console.error(`No pullRequestNumber from changeset action.`);
  process.exit(1);
}
const GITHUB_GET_PR = `https://api.github.com/repos/lit/lit/pulls/${pullRequestNumber}`;

const response = await new Promise((resolve) => {
  let finalData = '';
  https
    .get(
      GITHUB_GET_PR,
      {
        headers: {
          accept: 'application/vnd.github+json',
          'User-Agent': 'Lit',
        },
      },
      (res) => {
        res.on('data', (d) => {
          finalData += d;
        });

        res.on('end', () => {
          resolve(JSON.parse(finalData));
        });
      }
    )
    .on('error', (e) => {
      console.error(e);
      process.exit(1);
    });
});

const {body} = response;

// Strip the preamble from the PR description, and only capture the changelog
// contents.
const headingIdx = body.indexOf('# Releases');
console.log(body.slice(headingIdx === -1 ? 0 : headingIdx));
