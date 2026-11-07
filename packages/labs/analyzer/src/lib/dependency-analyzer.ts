/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Dependency analyzer for discovering custom elements from installed packages.
 *
 * Uses a layered approach:
 * 1. Custom Elements Manifest (CEM) — preferred when a package publishes
 *    `custom-elements.json`
 * 2. Compiled fallback — scans compiled JS entry points for
 *    `customElements.define()` calls
 *
 * Results are cached per package name + version and lazily loaded on first
 * access.
 */

import type {AnalyzerInterface} from './model.js';
import {parseCustomElementsManifest} from './cem-reader.js';

/**
 * Minimal filesystem interface needed by the dependency analyzer.
 * Compatible with `AnalyzerInterface['fs']` but requires only `readFile`.
 */
export type DependencyFs = Pick<AnalyzerInterface['fs'], 'readFile'>;

/**
 * Minimal path interface needed by the dependency analyzer.
 * Compatible with `AnalyzerInterface['path']` but requires only `join` and
 * `normalize`.
 */
export type DependencyPath = Pick<
  AnalyzerInterface['path'],
  'join' | 'normalize'
>;

// Public types for dependency element metadata

export interface DependencyProperty {
  name: string;
  type?: string | undefined;
  default?: string | undefined;
  description?: string | undefined;
  attribute?: string | undefined;
  reflects?: boolean | undefined;
}

export interface DependencyAttribute {
  name: string;
  type?: string | undefined;
  default?: string | undefined;
  description?: string | undefined;
  fieldName?: string | undefined;
}

export interface DependencyEvent {
  name: string;
  type?: string | undefined;
  description?: string | undefined;
}

export interface DependencyCustomElement {
  tagName: string;
  className: string;
  packageName: string;
  modulePath: string;
  properties: Map<string, DependencyProperty>;
  attributes: Map<string, DependencyAttribute>;
  events: Map<string, DependencyEvent>;
  description?: string | undefined;
  source: 'cem' | 'compiled';
}

/**
 * Discovers and caches custom element metadata from dependency packages.
 *
 * Provides a tag-name-based registry that merges elements found across
 * all analyzed packages. Each package is analyzed at most once per
 * name+version combination.
 */
export class DependencyAnalyzer {
  /**
   * Cache of analyzed packages keyed by `packageName@version`.
   * Prevents redundant parsing when multiple modules reference the same
   * dependency.
   */
  private readonly _cache = new Map<string, DependencyCustomElement[]>();

  /**
   * Global tag-name registry mapping tag names to their element metadata.
   * Populated lazily as packages are analyzed.
   */
  private readonly _registry = new Map<string, DependencyCustomElement>();

  private readonly _fs: DependencyFs;
  private readonly _path: DependencyPath;

  constructor(fs: DependencyFs, path: DependencyPath) {
    this._fs = fs;
    this._path = path;
  }

  /**
   * Returns the custom element metadata for the given tag name, or
   * `undefined` if no element with that tag has been discovered.
   */
  getCustomElement(tagName: string): DependencyCustomElement | undefined {
    return this._registry.get(tagName);
  }

  /**
   * Returns all custom elements discovered across all analyzed packages.
   */
  getAllCustomElements(): DependencyCustomElement[] {
    return Array.from(this._registry.values());
  }

  /**
   * Analyzes a dependency package at `packageRoot` for custom element
   * definitions. Uses the CEM if available, falling back to compiled
   * analysis.
   *
   * Results are cached by package name and version so repeated calls
   * for the same package are inexpensive.
   */
  analyzePackage(packageRoot: string): DependencyCustomElement[] {
    const packageJsonPath = this._path.join(packageRoot, 'package.json');
    const packageJsonContent = this._fs.readFile(packageJsonPath);
    if (!packageJsonContent) return [];

    let packageJson: {
      name?: string;
      version?: string;
      customElements?: string;
      module?: string;
      main?: string;
    };
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch {
      return [];
    }

    const packageName = packageJson.name ?? '';
    const version = packageJson.version ?? '0.0.0';
    const cacheKey = `${packageName}@${version}`;

    // Return cached results
    const cached = this._cache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Try CEM first, fall back to compiled analysis
    let elements = this._tryReadCEM(packageRoot, packageJson, packageName);
    if (elements.length === 0) {
      elements = this._analyzeCompiled(packageRoot, packageJson, packageName);
    }

    // Cache and register
    this._cache.set(cacheKey, elements);
    for (const el of elements) {
      this._registry.set(el.tagName, el);
    }

    return elements;
  }

  /**
   * Attempts to read and parse a Custom Elements Manifest from the package.
   * Checks the `customElements` field in `package.json` for a custom path,
   * falling back to the standard `custom-elements.json`.
   */
  private _tryReadCEM(
    packageRoot: string,
    packageJson: {customElements?: string},
    packageName: string
  ): DependencyCustomElement[] {
    const cemPath = packageJson.customElements ?? 'custom-elements.json';
    const cemFullPath = this._path.join(packageRoot, cemPath);
    const content = this._fs.readFile(cemFullPath);
    if (!content) return [];
    return parseCustomElementsManifest(content, packageName);
  }

  /**
   * Fallback analysis: scans the package's main entry point for
   * `customElements.define()` calls using a regex-based approach.
   *
   * This provides basic tag-name/class-name discovery for packages
   * that don't publish a CEM.
   */
  private _analyzeCompiled(
    packageRoot: string,
    packageJson: {module?: string; main?: string},
    packageName: string
  ): DependencyCustomElement[] {
    const elements: DependencyCustomElement[] = [];

    const mainFile = packageJson.module ?? packageJson.main;
    if (!mainFile) return elements;

    const mainPath = this._path.join(packageRoot, mainFile);
    const content = this._fs.readFile(mainPath);
    if (!content) return elements;

    // Match customElements.define('tag-name', ClassName) patterns
    const defineRegex =
      /customElements\.define\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g;
    let match;
    while ((match = defineRegex.exec(content)) !== null) {
      const tagName = match[1];
      const className = match[2];
      elements.push({
        tagName,
        className,
        packageName,
        modulePath: mainFile,
        properties: new Map(),
        attributes: new Map(),
        events: new Map(),
        source: 'compiled',
      });
    }

    return elements;
  }
}
