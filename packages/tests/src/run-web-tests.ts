/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview This file replaces the WTR binary so that it can control
 * how open ports are found, eliminating a race condition and limiting ports
 * to a Sauce compatible list.
 */

import {startTestRunner, TestRunner} from '@web/test-runner';

process.on('uncaughtException', (error) => {
  if ((error as Error & {code?: string}).code === 'EADDRINUSE') {
    // Try again
    currentRunner?.stop();
    startWithNextAvailablePort();
  } else {
    console.error(`uncaughtException: ${error}`);
    if (error?.stack !== undefined) {
      console.error(error.stack);
    }
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
});

const stopNicely = () => {
  if (run && currentRunner === undefined) {
    // eslint-disable-next-line no-undef
    process.exit(1);
  } else {
    // This will trigger the `currentRunner.on('stop')` below which will call
    // process.exit() with the correct exit code
    currentRunner?.stop();
  }
};

// eslint-disable-next-line no-undef
process.on('SIGINT', stopNicely);
// eslint-disable-next-line no-undef
process.on('exit', stopNicely);

// Sauce Labs compatible ports taken from
// https://docs.saucelabs.com/secure-connections/sauce-connect/faq/#supported-browsers-and-ports
// Except:
// - 80, 443, 888: these ports must have root access
// - 5555, 8080: not forwarded on Android
// prettier-ignore
const SAUCE_PORTS = [
  2000, 2001, 2020, 2109, 2222, 2310,
  3000, 3001, 3010, 3030, 3210, 3333,
  4000, 4001, 4201, 4040, 4321, 4502, 4503, 4567,
  5000, 5001, 5002, 5050, 5432,
  6000, 6001, 6060, 6666, 6543,
  7000, 7070, 7774, 7777,
  8000, 8001, 8003, 8031, 8080, 8081, 8443, 8765, 8777, 8888,
  9000, 9001, 9031, 9080, 9081, 9090, 9191, 9876, 9877, 9999,
  49221, 55001
];

let currentPortIndex = 0;
let currentRunner: TestRunner | undefined;

async function startWithNextAvailablePort() {
  if (currentPortIndex === SAUCE_PORTS.length) {
    throw new Error(
      `No available ports. Ports tried: ${JSON.stringify(SAUCE_PORTS)}`
    );
  }
  const port = SAUCE_PORTS[currentPortIndex];
  currentPortIndex++;
  // Note: startTestRunner() will *not* reject if a port is in use.
  // Instead it'll trigger an uncaughtException
  currentRunner = await startTestRunner({
    // This is extra WTR config in addition to the local config file
    config: {
      port,
    },
    autoExitProcess: false,
  });
  currentRunner?.on('stopped', (passed) => {
    // eslint-disable-next-line no-undef
    process.exit(passed ? 0 : 1);
  });
}

const run = process.env.RUN_BROWSER_TESTS?.toLowerCase() !== 'false';

if (run) {
  await startWithNextAvailablePort();
} else {
  process.exit(0);
}
