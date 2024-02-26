/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import cors from 'koa-cors';
import type {AddressInfo} from 'net';
import * as path from 'node:path';
import type {DevServer} from './types.cjs';
import {logChannel} from './logging.js';
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
import wds = require('@web/dev-server');

const uiRoot = path.dirname(require.resolve('@lit-labs/ignition-ui'));
let uiServerPromise: Promise<DevServer>;

export const getUiServer = async () => {
  return (uiServerPromise ??= wds
    .startDevServer({
      config: {
        nodeResolve: true,
        rootDir: path.join(uiRoot),
        middleware: [cors({origin: '*', credentials: true})],
      },
      readCliArgs: false,
      readFileConfig: false,
    })
    .then((server) => {
      const uiServerAddress = server.server?.address() as AddressInfo;
      logChannel.appendLine(`UI server started on ${uiServerAddress.port}`);
      return server;
    }));
};
