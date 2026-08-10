/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {html} from 'lit';

html`<div ${'foo'}></div>`;
html`<div ${123}></div>`;
html`<div ${true}></div>`;
html`<div ${{}}></div>`;
