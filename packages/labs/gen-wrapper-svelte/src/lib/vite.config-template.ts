/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {PackageJson} from '@lit-labs/analyzer/lib/model.js';
import {javascript} from '@oicl-lit/gen-utils/lib/str-utils.js';

/**
 * Generates a Vite config.
 *
 * Note, ideally we would be using Vite library mode instead of configuring
 * the `rollupOptions` manually. However, Vite supports only a single entry
 * file in that case, and this generator supports multiple modules.
 *
 * See https://github.com/vitejs/vite/discussions/1736.
 *
 */
export const viteConfigTemplate = (_pkgJson: PackageJson) => javascript`
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
`;
