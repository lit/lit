/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';

const value: string = 'hello';
export const templateA = html` <span .unknown=${value}></span> `;
