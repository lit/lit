#!/usr/bin/env node

/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Command-line interface for running SSR performance benchmarks
 */

import {runAllBenchmarks, runScenario} from './node-performance-tests.js';
import {COMMENT_TREE_CONFIGS} from './comment-tree-generator.js';

const scenarios = Object.keys(COMMENT_TREE_CONFIGS) as Array<string>;

async function main() {
  const args = process.argv.slice(2);
  const scenario = args[0];

  // Get scenario config for defaults (if scenario is specified and valid)
  const scenarioConfig =
    scenario && scenarios.includes(scenario)
      ? COMMENT_TREE_CONFIGS[scenario as keyof typeof COMMENT_TREE_CONFIGS]
      : null;

  // Parse options - use scenario defaults if available, otherwise global defaults
  const defaultIterations = scenarioConfig?.iterations ?? 10;
  const defaultWarmup = scenarioConfig?.warmupIterations ?? 3;

  const iterations = parseInt(
    args.find((arg) => arg.startsWith('--iterations='))?.split('=')[1] ??
      defaultIterations.toString()
  );
  const warmup = parseInt(
    args.find((arg) => arg.startsWith('--warmup='))?.split('=')[1] ??
      defaultWarmup.toString()
  );
  const quiet = args.includes('--quiet');

  const options = {
    iterations,
    warmupIterations: warmup,
    logProgress: !quiet,
  };

  try {
    if (!scenario || scenario === 'all') {
      await runAllBenchmarks(options);
    } else if (scenarios.includes(scenario)) {
      await runScenario(scenario as keyof typeof COMMENT_TREE_CONFIGS, options);
    } else {
      console.error(`❌ Unknown scenario: ${scenario}`);
      console.error(`Available scenarios: ${scenarios.join(', ')}, all`);
      console.error('');
      console.error('Usage:');
      console.error('  npm run benchmark [scenario] [options]');
      console.error('');
      console.error('Options:');
      console.error(
        '  --iterations=N    Number of test iterations (default: 10)'
      );
      console.error(
        '  --warmup=N        Number of warmup iterations (default: 3)'
      );
      console.error('  --quiet           Suppress progress output');
      console.error('');
      console.error('Examples:');
      console.error('  npm run benchmark');
      console.error('  npm run benchmark balanced');
      console.error('  npm run benchmark stress_test --iterations=5');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

main();
