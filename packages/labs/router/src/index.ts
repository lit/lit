/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
export * from './routes.js';
export {Router} from './router.js';

import './lit-router.js';
export {LitRouter} from './lit-router.js';

export {
  NavigationOptions,
  CustomRouterGuard,
  Suscription,
  Navigation,
  BaseRouter,
  Component,
  Guard,
} from './declarations.js';

export {RouteConfig, Route} from './route.js';
export * from './utils.js';
