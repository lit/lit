/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import cliArgs from 'command-line-args';
import cliUsage from 'command-line-usage';
import {parseRenderer} from './utils.js';
import {TemplateRenderer} from './renderers.js';
import combinatorics from 'js-combinatorics';
const {cartesianProduct} = combinatorics;

// Parse a numeric range; can optionally be a single value (e.g. '2'), a
// start/end ('2~6'), a start/end/step set ('2~6:2'), or a comma-separated list
// of values. Returns a concrete array of each value in range to test.
const range = (value: string): number[] => {
  if (value.includes(',')) {
    return value.split(',').map(Number);
  }
  const match = value.match(/([\d.]+)(?:~)?([\d.]+)?(?::)?([\d.]+)?/);
  if (match) {
    const [, start = 1, end = start, step = 1] = match;
    const values = [];
    for (let n = Number(start); n <= Number(end); n += Number(step)) {
      values.push(n);
    }
    return values;
  } else {
    throw new Error(`Malformed range: '${value}`);
  }
};

// Command line options (note this is in key/value format to more easily get a type
// for the available option keys); it is mapped into an array with name field
// for 'command-line-arguments'
const optionsDesc = {
  renderers: {
    type: (r: string) => r.split(/[, ]/),
    typeLabel: `{underline comma-separated}`,
    alias: 'r',
    defaultValue: '(will be set based on configured renderers)',
    description: '(will be set based on configured renderers)',
    defaultOption: true,
    noReport: false,
  },
  depth: {
    type: range,
    alias: 'd',
    description: 'Depth of tree (in nodes). Defaults to 5.',
    defaultValue: [range('5')],
    noReport: false,
  },
  width: {
    type: range,
    alias: 'w',
    description: 'Width of tree (in nodes). Defaults to 4.',
    defaultValue: range('4'),
    noReport: false,
  },
  attrPerNode: {
    type: range,
    alias: 'a',
    description: 'Attributes per node. Defaults to 4.',
    defaultValue: range('4'),
    noReport: false,
  },
  dynAttrPct: {
    type: range,
    alias: 'A',
    description:
      'Percentage of attributes that can be updated dynamically. Defaults to 0.5.',
    defaultValue: range('0.5'),
    noReport: false,
  },
  valPerDynAttr: {
    type: range,
    alias: 'v',
    description:
      'Number of dynamic values per dynamic attribute. Defaults to 2.',
    defaultValue: range('2'),
    noReport: false,
  },
  dynNodePct: {
    type: range,
    alias: 'N',
    description:
      'Percentage of nodes that can be updated dynamically (via template calls). Defaults to 0.5.',
    defaultValue: range('0.5'),
    noReport: false,
  },
  updateCount: {
    type: range,
    alias: 'u',
    description:
      'Number of times to update after initial render. Defaults to 1.',
    defaultValue: range('1'),
    noReport: false,
  },
  updateNodePct: {
    type: range,
    alias: 'U',
    description:
      'Percentage of dynamic nodes (template calls) changed each update. Defaults to 1.',
    defaultValue: range('1'),
    noReport: false,
  },
  updateAttrPct: {
    type: range,
    alias: 'T',
    description:
      'Percentage of dynamic attributes changed each update. Defaults to 1.',
    defaultValue: range('1'),
    noReport: false,
  },
  uniqueTemplates: {
    type: Boolean,
    alias: 'q',
    description:
      'Generate unique template per position in tree. Defaults to false.',
    defaultValue: false,
    noReport: false,
  },
  pretty: {
    type: Boolean,
    alias: 'p',
    description:
      'Pretty-print templates (should only be used for debugging, ' +
      'as it results in extra textNodes in lit-html templates). ' +
      'Defaults to false.',
    defaultValue: false,
    noReport: true,
  },
  runTachometer: {
    type: Boolean,
    alias: 't',
    description: 'Run tachometer on generated benchmarks. Defaults to false.',
    defaultValue: false,
    noReport: true,
  },
  sampleSize: {
    type: Number,
    alias: 's',
    description: 'Tachometer sample size.  Defaults to 50.',
    defaultValue: 50,
    noReport: true,
  },
  measure: {
    type: String,
    typeLabel: `{underline comma-separated}`,
    alias: 'm',
    description:
      'What value to report. Accepts `time`, `memory`, or a list of performance.measure names.',
    defaultValue: 'time',
    noReport: false,
  },
  generateIndex: {
    type: Boolean,
    alias: 'i',
    description: 'Generate an index.html file for manual running.',
    defaultValue: false,
    noReport: true,
  },
  generateOnlyBenchmarks: {
    type: Boolean,
    alias: 'g',
    description: 'Only generate the benchmark files, not tachometer.json.',
    defaultValue: false,
    noReport: true,
  },
  output: {
    type: String,
    alias: 'o',
    description:
      'Folder to output generated benchmarks into. Defaults to `./lit-html/generated`. ',
    defaultValue: 'generator/generated',
    noReport: true,
  },
  shortname: {
    type: String,
    alias: 'n',
    description:
      'Short naming prefix to use for naming output files. When omitted, ' +
      'files will include the full list of options affecting generation.',
    defaultValue: '',
    noReport: true,
  },
  clean: {
    type: Boolean,
    alias: '!',
    description:
      'Clean the specified output folder before generating; use caution as the ' +
      'contents of the output folder will be lost.',
    defaultValue: false,
    noReport: true,
  },
  runDeoptigate: {
    type: Boolean,
    alias: 'D',
    description:
      'Run deoptigate on output of benchmarks rather than running tachometer. ' +
      'Defaults to false.',
    defaultValue: false,
    noReport: true,
  },
  help: {
    type: Boolean,
    alias: 'h',
    description: 'Print this usage guide,',
    defaultValue: false,
    noReport: true,
  },
} as const;

export type OptionKey = keyof typeof optionsDesc;
export type OptionValues = {[key in OptionKey]: number} & {
  renderers: string;
} & {measure: string};

const usage = [
  {
    header: 'Template benchmark generator',
    content:
      'Parameterized benchmark generator and runner for DOM rendering libraries.',
  },
  {
    header: 'Options',
    optionList: {} as cliArgs.CommandLineOptions,
  },
  {
    header: 'Notes',
    content:
      'The {underline range} type accepts a number value, and optionally an ' +
      'ending value and a step size in the following formats:\n' +
      '- Single value: e.g. --depth 5\n' +
      '- Start and end: e.g. --depth 2~6 (runs at 2, 3, 4, 5, 6)\n' +
      '- Start, end, and step: e.g. --depth 2~6:2 (runs at 2, 4, 6)\n' +
      '- Discrete list of values (comma-separated): e.g. --depth 1,5,10\n\n' +
      'When ranges are provided, individual benchmarks representing the ' +
      'full cartesian product of all parameters will be generated.',
  },
];

// Return parsed CLI options
export const getOptions = (renderers: {[key: string]: TemplateRenderer}) => {
  // Late-bind the renderer options, so they can be defined separately
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererOptions = optionsDesc.renderers as any;
  rendererOptions.defaultValue = Object.keys(renderers);
  rendererOptions.description =
    `Library/configuration to render. Defaults to all available renderers. Available renderers:\n` +
    ` - ${Object.keys(renderers).join('\n  - ')}\n` +
    `To add a query string param, add '?...' to renderer name.\n` +
    `To select a specific version, add '@label=package@version' or '@label=version-info.json' to renderer name.`;

  // Options in format used by command-line-arguments & command-line-usage
  const optionList = Object.keys(optionsDesc).map((option) => ({
    name: option,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(optionsDesc as any)[option],
  }));
  usage[1].optionList = optionList;

  // Parse command line arguments
  const options = cliArgs(optionList);

  // Help
  if (options.help) {
    console.log(cliUsage(usage));
    process.exit(0);
  }

  // Return concrete renderer by exact match or by prefix
  const rendererForName = (name: string) => {
    const rendererName = renderers[name]
      ? name
      : Object.keys(renderers).find((r: string) => name.startsWith(r + '-'));
    return rendererName ? renderers[rendererName] : undefined;
  };

  // Validate
  for (const renderer of options.renderers) {
    const name = parseRenderer(renderer).base;
    if (!rendererForName(name)) {
      throw new Error(
        `Renderer '${name}' not valid; Choose one or more from '${Object.keys(
          renderers
        )}' (comma-separated)`
      );
    }
  }

  // Calculate cartesian product of all ranges
  const optionsAsArrays = Object.keys(options).map((option) =>
    Array.isArray(options[option]) ? options[option] : [options[option]]
  );
  const variations: (number | string)[][] = cartesianProduct(...optionsAsArrays)
    .toArray()
    .sort(
      (a, b) =>
        options.renderers.indexOf(a[0]) - options.renderers.indexOf(b[0])
    );

  // Subset of the CLI arguments that are reported in the output table
  const reportOptions = (Object.keys(optionsDesc) as OptionKey[]).filter(
    (option) => !optionsDesc[option].noReport
  );

  const variedOptions = reportOptions
    .filter((key) => Array.isArray(options[key]))
    .filter((key) => options[key].length > 1)
    // Filter out renderers with differing query strings or versions, since
    // those don't affect generation
    .filter(
      (key) =>
        key !== 'renderers' ||
        new Set(options.renderers.map((r: string) => parseRenderer(r).base))
          .size > 1
    );

  return {
    optionsDesc,
    options,
    reportOptions,
    variedOptions,
    variations,
    rendererForName,
  };
};
