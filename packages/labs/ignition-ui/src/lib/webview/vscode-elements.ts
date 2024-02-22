/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// Since vscode elements aren't self-registering, we need to register the ones
// that we use like this:

import {vsCodeButton} from '@vscode/webview-ui-toolkit/dist/button/index.js';
import {provideVSCodeDesignSystem} from '@vscode/webview-ui-toolkit/dist/vscode-design-system.js';

provideVSCodeDesignSystem().register(vsCodeButton());
