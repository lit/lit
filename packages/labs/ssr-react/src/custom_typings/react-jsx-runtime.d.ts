/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview Declarations for React jsx-runtime modules which are not
 * provided in `@types/react` as these modules are not meant for direct
 * consumption, only as part of JSX transform.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module 'react/jsx-dev-runtime' {
  export const Fragment: any;
  export const jsxDEV: any;
}
