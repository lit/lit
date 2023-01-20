/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// This script adds an issue from an external repository to the a GitHub project
// board.
//
// The GitHub API only supports adding issues from a repository in the same org
// as the project board (see
// https://github.com/orgs/community/discussions/6212). However, the GitHub UI
// also supports adding URLs from any repo. So we use a headless browser to work
// around the lack of API support by automating use of the GitHub UI.

import {chromium} from 'playwright';
import * as twofactor from 'node-2fa';

declare module 'node-2fa' {
  export function generateToken(seed: string): {token: string};
}

let missingEnv = false;
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined) {
    console.error(`Missing required environment variable: ${name}`);
    missingEnv = true;
  }
  return value ?? 'MISSING';
};

const GITHUB_USERNAME = requireEnv('GITHUB_USERNAME');
const GITHUB_PASSWORD = requireEnv('GITHUB_PASSWORD');
const GITHUB_2FA_SEED = requireEnv('GITHUB_2FA_SEED');
const PROJECT_VIEW_URL = requireEnv('PROJECT_VIEW_URL');
const ISSUE_URL = requireEnv('ISSUE_URL');

if (missingEnv) {
  process.exit(1);
}

console.log('Launching chromium');
const browser = await chromium.launch();
const page = await browser.newPage();

// Sign in to GitHub with our username and password.
console.log('Signing into GitHub');
await page.goto(
  `https://github.com/login/?return_to=${encodeURI(PROJECT_VIEW_URL)}`,
  {waitUntil: 'networkidle'}
);
await page.keyboard.type(GITHUB_USERNAME);
await page.keyboard.press('Tab');
await page.keyboard.type(GITHUB_PASSWORD);
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');

// We're redirected to the 2FA page.
await page.waitForNavigation({waitUntil: 'networkidle'});

// Enter the 2FA code.
console.log('Entering 2FA code');
const token = twofactor.generateToken(GITHUB_2FA_SEED).token;
await page.keyboard.type(token);
await page.keyboard.press('Enter');

// We're redirected to the project.
await page.waitForNavigation({waitUntil: 'networkidle'});

// Control+Space selects the "add item" input box, which accepts a URL.
console.log('Adding issue URL to project');
await page.keyboard.press('Control+Space');
await page.keyboard.type(ISSUE_URL);

// From looking in the network tab, the API that adds the issue looks like
// https://github.com/memexes/<number>/items, so wait for any kind of response
// from an API that looks like that before closing the browser.
const apiResponse = page.waitForResponse('**/items');
await page.keyboard.press('Enter');
await apiResponse;
console.log('Issue hopefully added to project!');

await browser.close();
