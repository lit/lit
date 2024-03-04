/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath} from '@lit-labs/analyzer';
import {AnalyzerInit} from '@lit-labs/analyzer/lib/analyzer.js';

type AnalyzerFs = AnalyzerInit['fs'];

/**
 * The writable in-memory buffers for the overlay filesystem.
 */
class InMemoryBuffers {
  readonly #buffers;
  constructor(buffers: Map<string, {contents: string; mtime: Date}>) {
    this.#buffers = buffers;
  }

  /**
   * Sets the contents of a file in the overlay filesystem.
   * Until closeMemoryFile is called, the overlay contents will be used
   * instead of the underlying filesystem contents.
   */
  set(path: AbsolutePath, contents: string) {
    const mtime = new Date();
    this.#buffers.set(path, {contents, mtime: new Date()});
  }

  /**
   * Closes the file in the overlay filesystem, so that the underlying
   * filesystem contents will be used again.
   */
  close(path: AbsolutePath) {
    this.#buffers.delete(path);
  }
}

/**
 * A filesystem that overlays an in-memory filesystem on top of an underlying
 * filesystem.
 *
 * Updating the in-memory overlay is done through the paired InMemoryBuffers
 * object, which is created with the OverlayFilesystem.
 */
export class OverlayFilesystem implements AnalyzerFs {
  readonly #underlyingFs: AnalyzerFs;
  readonly #overlay: ReadonlyMap<string, {contents: string; mtime: Date}>;
  private constructor(
    underlyingFs: AnalyzerFs,
    overlayMap: ReadonlyMap<string, {contents: string; mtime: Date}>
  ) {
    this.#underlyingFs = underlyingFs;
    if (underlyingFs.realpath) {
      this.realpath = underlyingFs.realpath.bind(underlyingFs);
    }
    this.#overlay = overlayMap;
  }

  static fromUnderlyingFilesystem(underlyingFs: AnalyzerFs) {
    const overlayMap = new Map<string, {contents: string; mtime: Date}>();
    const buffers = new InMemoryBuffers(overlayMap);
    const filesystem = new OverlayFilesystem(underlyingFs, overlayMap);
    return {filesystem, buffers};
  }

  readDirectory(
    path: string,
    extensions?: readonly string[] | undefined,
    exclude?: readonly string[] | undefined,
    include?: readonly string[] | undefined,
    depth?: number | undefined
  ): string[] {
    return this.#underlyingFs.readDirectory(
      path,
      extensions,
      exclude,
      include,
      depth
    );
  }
  readFile(path: string, encoding?: string | undefined): string | undefined {
    return (
      this.#overlay.get(path)?.contents ??
      this.#underlyingFs.readFile(path, encoding)
    );
  }
  realpath?: (path: string) => string;
  fileExists(path: string): boolean {
    return this.#overlay.has(path) || this.#underlyingFs.fileExists(path);
  }
  get useCaseSensitiveFileNames() {
    return this.#underlyingFs.useCaseSensitiveFileNames;
  }
  getModifiedTime(path: string): Date | undefined {
    return (
      this.#overlay.get(path)?.mtime ??
      this.#underlyingFs.getModifiedTime?.(path)
    );
  }
}
export type {InMemoryBuffers};
