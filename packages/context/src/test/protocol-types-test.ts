/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ContextRequestEvent, Context} from './protocol-types.js';
import {ContextRequestEvent as LitContextRequestEvent} from '../lib/context-request-event.js';
import {Context as LitContext} from '../index.js';

/*
 * These function definitions check whether the Lit and protocol types are
 * compatible.
 */

export const protocolFunction = (
  e: ContextRequestEvent<Context<unknown, unknown>>
) => {
  litFunction(e);
};

export const litFunction = (
  e: LitContextRequestEvent<LitContext<unknown, unknown>>
) => {
  protocolFunction(e);
};
