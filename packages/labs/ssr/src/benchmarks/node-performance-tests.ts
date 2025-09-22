/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Node.js-based performance tests for Lit SSR using Reddit-style comment trees
 * This replaces k6 tests since k6 cannot handle Node.js modules like 'lit'
 */

import {performance} from 'perf_hooks';
import {render} from '../lib/render.js';
import {
  generateCommentTreeData,
  analyzeCommentTree,
  COMMENT_TREE_CONFIGS,
  type CommentTreeConfig,
  type Comment,
} from './comment-tree-generator.js';
import {
  renderCommentThread,
  renderCommentThreadMinimal,
} from './comment-templates.js';

interface BenchmarkResult {
  variant: 'dsd' | 'no-dsd' | 'dsd-minimal' | 'no-dsd-minimal';
  totalComments: number;
  maxDepth: number;
  renderTime: number;
  templateSize: number;
  avgRepliesPerComment: number;
  totalCharacters: number;
  success: boolean;
  error?: string;
}

interface ScenarioResults {
  scenario: string;
  results: BenchmarkResult[];
  stats: {
    dsd: VariantStats;
    'no-dsd': VariantStats;
    'dsd-minimal': VariantStats;
    'no-dsd-minimal': VariantStats;
  };
}

interface VariantStats {
  avgRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  p75RenderTime: number;
  p90RenderTime: number;
  p95RenderTime: number;
  successRate: number;
  avgTemplateSize: number;
}

interface BenchmarkOptions {
  iterations: number;
  warmupIterations: number;
  logProgress: boolean;
}

const DEFAULT_OPTIONS: BenchmarkOptions = {
  iterations: 10,
  warmupIterations: 3,
  logProgress: true,
};

const LIT_SSR_OPTIONS = {
  elementRenderers: [],
  customElementInstanceStack: [],
  customElementHostStack: [],
  deferHydration: false,
};

/**
 * Renders a template to string using SSR and measures performance
 */
function renderTemplateToString(
  template: unknown,
  disableDsd = false
): {html: string; duration: number; size: number} {
  const startTime = performance.now();

  try {
    const renderResult = disableDsd
      ? render(template, LIT_SSR_OPTIONS)
      : render(template);
    let html = '';

    // Iterate through the generator to get all HTML chunks
    for (const chunk of renderResult) {
      html += chunk;
    }

    const duration = performance.now() - startTime;
    const size = html.length;

    return {html, duration, size};
  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

/**
 * Validates rendered HTML for basic correctness
 */
function validateHtml(html: string): boolean {
  if (html.length === 0) return false;

  // Check for comment indicators
  if (!html.includes('data-comment-id') && !html.includes('data-id'))
    return false;

  // Basic check for balanced div tags
  const openDivs = (html.match(/<div/g) || []).length;
  const closeDivs = (html.match(/<\/div>/g) || []).length;
  return openDivs === closeDivs;
}

/**
 * Runs a single benchmark iteration for a specific variant
 */
function runSingleBenchmark(
  variant: 'dsd' | 'no-dsd' | 'dsd-minimal' | 'no-dsd-minimal',
  comments: Comment[]
): BenchmarkResult {
  const stats = analyzeCommentTree(comments);

  const isMinimal = variant.includes('-minimal');
  const disableDsd = variant.includes('no-dsd');

  // Choose rendering template based on variant
  const template = isMinimal
    ? renderCommentThreadMinimal(comments)
    : renderCommentThread(comments);

  try {
    const {html, duration, size} = renderTemplateToString(template, disableDsd);
    const isValid = validateHtml(html);

    return {
      variant,
      totalComments: stats.totalComments,
      maxDepth: stats.maxDepth,
      renderTime: duration,
      templateSize: size,
      avgRepliesPerComment: stats.avgRepliesPerComment,
      totalCharacters: stats.totalCharacters,
      success: isValid,
    };
  } catch (error) {
    return {
      variant,
      totalComments: stats.totalComments,
      maxDepth: stats.maxDepth,
      renderTime: 0,
      templateSize: 0,
      avgRepliesPerComment: stats.avgRepliesPerComment,
      totalCharacters: stats.totalCharacters,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Calculates statistics for a set of benchmark results
 */
function calculateVariantStats(results: BenchmarkResult[]): VariantStats {
  const renderTimes = results.filter((r) => r.success).map((r) => r.renderTime);
  const sortedTimes = [...renderTimes].sort((a, b) => a - b);
  const p75Index = Math.floor(sortedTimes.length * 0.75);
  const p90Index = Math.floor(sortedTimes.length * 0.9);
  const p95Index = Math.floor(sortedTimes.length * 0.95);

  return {
    avgRenderTime:
      renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length || 0,
    minRenderTime: Math.min(...renderTimes) || 0,
    maxRenderTime: Math.max(...renderTimes) || 0,
    p75RenderTime: sortedTimes[p75Index] || 0,
    p90RenderTime: sortedTimes[p90Index] || 0,
    p95RenderTime: sortedTimes[p95Index] || 0,
    successRate: results.filter((r) => r.success).length / results.length,
    avgTemplateSize:
      results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + r.templateSize, 0) /
        results.filter((r) => r.success).length || 0,
  };
}

/**
 * Runs multiple iterations of a benchmark and returns statistics for all 4 variants
 */
function runBenchmarkSuite(
  scenario: string,
  config: CommentTreeConfig,
  options: Partial<BenchmarkOptions> = {}
): ScenarioResults {
  // Use scenario-specific defaults, then global defaults, then provided options
  const scenarioDefaults = {
    iterations: config.iterations,
    warmupIterations: config.warmupIterations,
    logProgress: DEFAULT_OPTIONS.logProgress,
  };
  const opts = {...scenarioDefaults, ...options};
  const results: BenchmarkResult[] = [];

  // Generate test data once
  if (opts.logProgress) {
    console.log(`\n📊 Starting ${scenario} benchmark...`);
    console.log(`Generating test data...`);
  }

  const comments = generateCommentTreeData(config);
  const stats = analyzeCommentTree(comments);

  if (opts.logProgress) {
    console.log(
      `📈 Test data: ${stats.totalComments} comments, max depth ${stats.maxDepth}`
    );
    console.log(
      `🔄 Running ${opts.warmupIterations} warmup + ${opts.iterations} test iterations (4 variants each)...`
    );
  }

  const variants: Array<'dsd' | 'no-dsd' | 'dsd-minimal' | 'no-dsd-minimal'> = [
    'dsd',
    'no-dsd',
    'dsd-minimal',
    'no-dsd-minimal',
  ];

  // Warmup iterations - one for each variant
  for (let i = 0; i < opts.warmupIterations; i++) {
    for (const variant of variants) {
      runSingleBenchmark(variant, comments);
    }
    if (
      opts.logProgress &&
      (i + 1) % Math.max(1, Math.floor(opts.warmupIterations / 3)) === 0
    ) {
      process.stdout.write('🔥');
    }
  }

  if (opts.logProgress && opts.warmupIterations > 0) {
    console.log(' warmup complete');
  }

  // Test iterations - all 4 variants per iteration
  for (let i = 0; i < opts.iterations; i++) {
    for (const variant of variants) {
      const result = runSingleBenchmark(variant, comments);
      results.push(result);
    }

    if (
      opts.logProgress &&
      (i + 1) % Math.max(1, Math.floor(opts.iterations / 10)) === 0
    ) {
      process.stdout.write('✅');
    }
  }

  if (opts.logProgress) {
    console.log(' benchmarks complete');
  }

  // Group results by variant and calculate stats
  const variantResults = {
    dsd: results.filter((r) => r.variant === 'dsd'),
    'no-dsd': results.filter((r) => r.variant === 'no-dsd'),
    'dsd-minimal': results.filter((r) => r.variant === 'dsd-minimal'),
    'no-dsd-minimal': results.filter((r) => r.variant === 'no-dsd-minimal'),
  };

  return {
    scenario,
    results,
    stats: {
      dsd: calculateVariantStats(variantResults.dsd),
      'no-dsd': calculateVariantStats(variantResults['no-dsd']),
      'dsd-minimal': calculateVariantStats(variantResults['dsd-minimal']),
      'no-dsd-minimal': calculateVariantStats(variantResults['no-dsd-minimal']),
    },
  };
}

/**
 * Formats benchmark results for display in a table
 */
function formatResults(scenario: string, benchmarkData: ScenarioResults): void {
  const {stats} = benchmarkData;

  console.log(`\n🎯 Results for ${scenario.toUpperCase()}:`);

  // Calculate iterations per variant (should be the same for all)
  const iterationsPerVariant = benchmarkData.results.filter(
    (r) => r.variant === 'dsd'
  ).length;
  console.log(`   Iterations: ${iterationsPerVariant} per variant\n`);

  // Table header - sized to fit " ✅ No DSD Minimal " (longest content + space)
  console.log(
    '   ┌───────────────────┬──────────────┬─────────────┬─────────────┬─────────────┬──────────────┐'
  );
  console.log(
    '   │ Variant           │ Avg (ms)     │ p75 (ms)    │ p90 (ms)    │ p95 (ms)    │ Size (KB)    │'
  );
  console.log(
    '   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤'
  );

  // Table rows
  const variants: Array<{key: keyof typeof stats; label: string}> = [
    {key: 'dsd', label: 'DSD'},
    {key: 'no-dsd', label: 'No DSD'},
    {key: 'dsd-minimal', label: 'DSD Minimal'},
    {key: 'no-dsd-minimal', label: 'No DSD Minimal'},
  ];

  variants.forEach((variant, index) => {
    const variantStats = stats[variant.key];

    // Format values to match exact header spacing - account for emoji width (emojis = 2 chars)
    const status = variantStats.successRate >= 0.95 ? '✅' : '❌';

    // Build first column with proper spacing for longest content
    // " ✅ No DSD Minimal " needs 18 JS chars (19 terminal chars with emoji)
    const baseText = ` ${status} ${variant.label}`;
    const col1 = baseText.padEnd(18, ' '); // 18 JS chars = 19 terminal chars with emoji
    const col2 = ` ${variantStats.avgRenderTime.toFixed(1)}`.padEnd(14, ' '); // " 132.3        "
    const col3 = ` ${variantStats.p75RenderTime.toFixed(1)}`.padEnd(13, ' '); // " 132.3       "
    const col4 = ` ${variantStats.p90RenderTime.toFixed(1)}`.padEnd(13, ' '); // " 132.3       "
    const col5 = ` ${variantStats.p95RenderTime.toFixed(1)}`.padEnd(13, ' '); // " 132.3       "
    const col6 = ` ${(variantStats.avgTemplateSize / 1024).toFixed(1)}`.padEnd(
      14,
      ' '
    ); // " 3531.1       "

    console.log(`   │${col1}│${col2}│${col3}│${col4}│${col5}│${col6}│`);

    if (index < variants.length - 1) {
      console.log(
        '   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤'
      );
    }
  });

  console.log(
    '   └───────────────────┴──────────────┴─────────────┴─────────────┴─────────────┴──────────────┘'
  );

  // Performance comparisons
  const dsdVsNoDsd = stats.dsd.avgRenderTime / stats['no-dsd'].avgRenderTime;
  const fullVsMinimal =
    ((stats.dsd.avgRenderTime + stats['no-dsd'].avgRenderTime) /
      2 /
      (stats['dsd-minimal'].avgRenderTime +
        stats['no-dsd-minimal'].avgRenderTime)) *
    2;

  console.log(`\n   📊 Performance Impact:`);
  console.log(
    `      DSD vs No DSD: ${dsdVsNoDsd.toFixed(2)}x (${dsdVsNoDsd > 1 ? 'DSD slower' : 'DSD faster'})`
  );
  console.log(
    `      Full vs Minimal: ${fullVsMinimal.toFixed(2)}x speedup with minimal templates`
  );
}

/**
 * Runs all benchmark scenarios
 */
export async function runAllBenchmarks(
  options: Partial<BenchmarkOptions> = {}
): Promise<void> {
  console.log('🚀 Starting Lit SSR Performance Benchmarks');
  console.log('==========================================');

  const scenarios = [
    {name: 'shallow-wide', config: COMMENT_TREE_CONFIGS.shallow_wide},
    {name: 'deep-narrow', config: COMMENT_TREE_CONFIGS.deep_narrow},
    {name: 'balanced', config: COMMENT_TREE_CONFIGS.balanced},
    {name: 'reddit-frontpage', config: COMMENT_TREE_CONFIGS.reddit_frontpage},
    {name: 'stress-test', config: COMMENT_TREE_CONFIGS.stress_test},
  ];

  const allResults: Array<{scenario: string; data: ScenarioResults}> = [];

  for (const scenario of scenarios) {
    const data = runBenchmarkSuite(scenario.name, scenario.config, options);
    formatResults(scenario.name, data);
    allResults.push({scenario: scenario.name, data});
  }

  // Summary table
  console.log('\n📋 BENCHMARK SUMMARY');
  console.log('====================');
  console.log(
    'Scenario         │ DSD Avg    │ No DSD Avg │ DSD Min Avg │ No DSD Min Avg │'
  );
  console.log(
    '─────────────────┼────────────┼────────────┼─────────────┼────────────────┤'
  );

  allResults.forEach(({scenario, data}) => {
    const dsdAvg = data.stats.dsd.avgRenderTime.toFixed(1).padStart(6);
    const noDsdAvg = data.stats['no-dsd'].avgRenderTime.toFixed(1).padStart(7);
    const dsdMinAvg = data.stats['dsd-minimal'].avgRenderTime
      .toFixed(1)
      .padStart(7);
    const noDsdMinAvg = data.stats['no-dsd-minimal'].avgRenderTime
      .toFixed(1)
      .padStart(10);

    const allSuccess = Object.values(data.stats).every(
      (s) => s.successRate >= 0.95
    );
    const status = allSuccess ? '✅' : '❌';

    console.log(
      `${status} ${scenario.padEnd(13)} │ ${dsdAvg}ms   │ ${noDsdAvg}ms    │ ${dsdMinAvg}ms     │ ${noDsdMinAvg}ms       │`
    );
  });

  console.log('\n🎉 All benchmarks completed!');
}

/**
 * Runs a specific benchmark scenario
 */
export async function runScenario(
  scenarioName: keyof typeof COMMENT_TREE_CONFIGS,
  options: Partial<BenchmarkOptions> = {}
): Promise<void> {
  const config = COMMENT_TREE_CONFIGS[scenarioName];
  if (!config) {
    throw new Error(`Unknown scenario: ${scenarioName}`);
  }

  console.log(`🎯 Running ${scenarioName} benchmark`);
  console.log('='.repeat(30 + scenarioName.length));

  const data = runBenchmarkSuite(scenarioName, config, options);
  formatResults(scenarioName, data);
}
