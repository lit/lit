/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextCallback,
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextEvent,
} from '@lit/context';

export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  Context,
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextKey,
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextType,
  /**
   * @deprecated import from `@lit/context` instead
   */
  createContext,
} from '@lit/context';

export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextConsumer,
} from '@lit/context';
export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextProvider,
} from '@lit/context';
export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  ContextRoot,
} from '@lit/context';

export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  provide,
} from '@lit/context';
export {
  /**
   * @deprecated import from `@lit/context` instead
   */
  consume,
} from '@lit/context';

import {provide, consume} from '@lit/context';

/**
 * @deprecated use `provide` from `@lit/context` instead
 */
export const contextProvider = provide;

/**
 * @deprecated use `consume` from `@lit/context` instead
 */
export const contextProvided = consume;
