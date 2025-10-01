# SSR Performance Benchmarks

This directory contains Node.js performance tests for Lit SSR using Reddit-style comment trees to simulate deeply nested and wide content structures.

## Overview

The benchmark suite tests SSR performance with various comment tree structures:

- **Shallow Wide**: Many top-level comments with few nested replies (popular posts)
- **Deep Narrow**: Long comment chains with deep nesting but few siblings
- **Balanced**: Typical Reddit structures with moderate depth and width
- **Stress Test**: Extreme scenarios with very large trees
- **Comparison**: Tests comparing full vs minimal template rendering

## Architecture

- **No Web Server**: Tests call SSR's `render()` function directly
- **Plain Lit Templates**: Uses `lit-html` templates without LitElements
- **Generator Iteration**: Measures time to iterate through the render generator
- **Deterministic Data**: Tree structures are generated deterministically for reproducible results
- **Configurable Scenarios**: Various tree structures with realistic content patterns
- **Node.js Performance**: Uses Node.js `performance.now()` for high-precision timing

## Files

- `comment-tree-generator.ts` - Generates Reddit-style comment tree data
- `comment-templates.ts` - Lit templates for rendering comment trees
- `node-performance-tests.ts` - Main Node.js performance test suite
- `cli.ts` - Command-line interface for running benchmarks

## Running Benchmarks

From the SSR package directory:

```bash
# Build the benchmark files
npm run build

# Run all benchmark scenarios
npm run benchmark:all

# Run individual scenarios
npm run benchmark:shallow-wide
npm run benchmark:deep-narrow
npm run benchmark:balanced
npm run benchmark:stress-test
npm run benchmark:comparison

# Run the default mixed workload test
npm run benchmark
```

### Using Wireit

All benchmark commands use Wireit and will automatically build dependencies:

```bash
# This will build first, then run benchmarks
WIREIT_LOGGER=simple npm run benchmark:balanced
```

### Custom Options

You can customize benchmark behavior with command-line options:

```bash
# Run with more iterations
npm run benchmark:balanced -- --iterations=20

# Run with longer warmup
npm run benchmark:stress-test -- --warmup=5

# Run quietly (no progress output)
npm run benchmark:shallow-wide -- --quiet

# Combine options
npm run benchmark -- --iterations=5 --warmup=2 --quiet
```

### Available Options

- `--iterations=N` - Number of test iterations per scenario (overrides scenario defaults)
- `--warmup=N` - Number of warmup iterations (overrides scenario defaults)
- `--quiet` - Suppress progress output for CI/automated use

**Note**: Each scenario has its own default iteration and warmup counts optimized for that test type. CLI flags override these scenario-specific defaults.

**Automatic Testing**: Each scenario automatically tests 4 variants:

- **DSD**: Full template with declarative shadow DOM enabled
- **No DSD**: Full template with declarative shadow DOM disabled
- **DSD Minimal**: Minimal template with declarative shadow DOM enabled
- **No DSD Minimal**: Minimal template with declarative shadow DOM disabled

## Test Configuration

Each scenario has different iteration counts and characteristics configured in `COMMENT_TREE_CONFIGS`:

### Shallow Wide

- **Iterations**: 10 (default, can override with `--iterations=N`)
- **Warmup**: 3 iterations (default, can override with `--warmup=N`)
- **Characteristics**: Many top-level comments with few nested replies
- **Use Case**: Popular posts with broad engagement

### Deep Narrow

- **Iterations**: 15 (default, can override with `--iterations=N`)
- **Warmup**: 5 iterations (default, can override with `--warmup=N`)
- **Characteristics**: Long comment chains with deep nesting but few siblings
- **Use Case**: Long debates and discussion threads

### Balanced

- **Iterations**: 10 (default, can override with `--iterations=N`)
- **Warmup**: 3 iterations (default, can override with `--warmup=N`)
- **Characteristics**: Moderate depth and width - typical Reddit structures
- **Use Case**: Most common real-world scenarios

### Stress Test

- **Iterations**: 5 (default, can override with `--iterations=N`)
- **Warmup**: 2 iterations (default, can override with `--warmup=N`)
- **Characteristics**: Extreme scale with very large trees
- **Use Case**: Performance limits testing

### Reddit Frontpage (Comparison)

- **Iterations**: 8 (default, can override with `--iterations=N`)
- **Warmup**: 2 iterations (default, can override with `--warmup=N`)
- **Characteristics**: Large-scale Reddit frontpage scenario
- **Use Case**: Template optimization analysis and scaling tests

## Metrics

The benchmarks track several performance metrics for each of the 4 variants:

- **Render Time**: Time to render templates (milliseconds)
- **Percentiles**: p75, p90, p95 response time distribution
- **Template Size**: Size of rendered HTML (bytes/KB)
- **Comment Count**: Number of comments in test data
- **Success Rate**: Percentage of successful renders (✅/❌ indicators)
- **Performance Comparisons**: DSD vs No DSD impact, Full vs Minimal speedup

## Example Output

```
🎯 Results for SHALLOW_WIDE:
   Iterations: 1 per variant

   ┌───────────────────┬──────────────┬─────────────┬─────────────┬─────────────┬──────────────┐
   │ Variant           │ Avg (ms)     │ p75 (ms)    │ p90 (ms)    │ p95 (ms)    │ Size (KB)    │
   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤
   │ ✅ DSD            │ 125.2        │ 125.2       │ 125.2       │ 125.2       │ 3531.1       │
   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤
   │ ✅ No DSD         │ 96.9         │ 96.9        │ 96.9        │ 96.9        │ 3531.1       │
   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤
   │ ✅ DSD Minimal    │ 37.6         │ 37.6        │ 37.6        │ 37.6        │ 1210.7       │
   ├───────────────────┼──────────────┼─────────────┼─────────────┼─────────────┼──────────────┤
   │ ✅ No DSD Minimal │ 38.7         │ 38.7        │ 38.7        │ 38.7        │ 1210.7       │
   └───────────────────┴──────────────┴─────────────┴─────────────┴─────────────┴──────────────┘

   📊 Performance Impact:
      DSD vs No DSD: 1.29x (DSD slower)
      Full vs Minimal: 2.91x speedup with minimal templates
```

## Comment Tree Structure

The generator creates deterministic Reddit-style data:

```typescript
interface Comment {
  id: string;
  author: string;
  content: string;
  score: number;
  timestamp: Date;
  replies: Comment[];
  depth: number;
}
```

### Deterministic Generation

- **Consistent Content**: Every 10th comment (index % 10 === 0) uses long content for predictable size distribution
- **Fixed Usernames**: Authors selected deterministically based on depth and index
- **Reproducible Scores**: Scores calculated using `(depth * 173 + index * 47) % 1000 - 50`
- **Static Timestamps**: All timestamps relative to 2024-01-01 for consistency
- **Deterministic IDs**: Simple `comment_d{depth}_i{index}` format
- **Predictable Nesting**: Reply patterns based on modulo operations for consistent tree shapes

This ensures identical template sizes and structures across benchmark runs, making performance comparisons reliable.

## Performance Considerations

- **Memory**: Large trees can use significant memory
- **Recursion**: Deep trees test recursive template rendering
- **String Concatenation**: Tests efficiency of HTML generation
- **Template Complexity**: Compares styled vs minimal templates

## Integration with CI

The benchmarks can be integrated into CI/CD pipelines:

```bash
# Run quick balanced test
npm run benchmark:balanced -- --quiet

# Run with fewer iterations for CI speed
npm run benchmark:shallow-wide -- --iterations=3 --warmup=1

# Run all scenarios quickly
npm run benchmark -- --iterations=2 --warmup=1 --quiet
```

## Development

To add new benchmark scenarios:

1. Create new config in `comment-tree-generator.ts` with the following structure:
   ```typescript
   new_scenario: {
     maxDepth: number,
     maxRepliesPerComment: number,
     minRepliesPerComment: number,
     topLevelComments: number,
     iterations: number,        // Default iterations for this scenario
     warmupIterations: number,  // Default warmup iterations
   }
   ```
2. Add npm script in `package.json` pointing to the main CLI
3. Update this README

The CLI automatically detects all scenarios from `COMMENT_TREE_CONFIGS`, so no code changes are needed for new scenarios.

## Troubleshooting

**Build Errors**: Ensure TypeScript compilation succeeds with `npm run build:ts`

**Memory Issues**: Reduce tree size in stress test configurations by modifying `COMMENT_TREE_CONFIGS`

**Slow Performance**:

- Check that dependencies are built with `npm run build`
- Reduce iterations for faster testing: `--iterations=3 --warmup=1`
- Use `--quiet` flag to reduce console output overhead

**Module Resolution Errors**: Ensure you're running from the correct directory and all dependencies are installed
