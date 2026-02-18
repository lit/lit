/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * SSR Performance Benchmarks with Node.js
 *
 * This module provides Node.js-based performance tests for Lit SSR using Reddit-style
 * comment trees to simulate deeply nested and wide content structures.
 */

// Re-export all test functions and utilities
export * from './comment-tree-generator.js';
export * from './comment-templates.js';
export * from './node-performance-tests.js';
