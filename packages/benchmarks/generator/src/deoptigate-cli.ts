/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import cliArgs from 'command-line-args';
import cliUsage from 'command-line-usage';
import {deoptigate} from './deoptigate.js';

const optionList = [
  {
    name: 'url',
    type: String,
    alias: 'u',
    required: true,
    description: 'URL to evaluate',
  },
  {
    name: 'output',
    type: String,
    alias: 'o',
    description:
      'Folder to output generated benchmarks into. Defaults to `generated`. ',
    defaultValue: 'generated',
  },
  {
    name: 'open',
    type: Boolean,
    alias: 'O',
    description: 'Open report via local server. ',
    defaultValue: false,
  },
  {
    name: 'help',
    type: Boolean,
    alias: 'h',
    description: 'Print this usage guide,',
    defaultValue: false,
  },
];

const usage = [
  {
    header: 'Deoptigate runner & output generator',
    content:
      'Captures a v8 log for the given URL using Puppeteer, and generates a Deoptigate report based on it.',
  },
  {
    header: 'Options',
    optionList,
  },
];

// Parse command line arguments
const options = cliArgs(optionList);

// Help
if (options.help || !options.url) {
  console.log(cliUsage(usage));
  process.exit(0);
}

process.on('SIGINT', function () {
  process.exit(1);
});

deoptigate(options.output, options.url, options.open);
