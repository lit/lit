/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';

export const templateA = html` <span .unknown=${'hello'}></span> `;

export const unknownElementUnknownProp = html` <unknownel
  .unknownelprop=${''}
></unknownel>`;
