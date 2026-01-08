/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

// eslint-disable-next-line no-var
declare var litSsrCallConnectedCallback: undefined | boolean;

// eslint-disable-next-line no-var
declare var litServerRoot: HTMLElement;

/**
 * https://github.com/tc39/proposal-shadowrealm
 */
declare class ShadowRealm {
  constructor();
  importValue<T extends PrimitiveValueOrCallable>(
    specifier: string,
    bindingName: string
  ): Promise<T>;
  evaluate<T extends PrimitiveValueOrCallable>(sourceText: string): T;
}

declare type PrimitiveValueOrCallable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Function;
