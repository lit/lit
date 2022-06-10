/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export interface FixtureOption {
  modules: string[];
  base?: string;
}

export interface SsrFixtureOption extends FixtureOption {
  hydrate?: boolean;
}
