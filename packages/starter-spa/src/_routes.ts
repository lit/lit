import {RouteConfig} from '@lit-labs/router';
import {registerRoute} from './utils/navigation.js';

export const routes: RouteConfig[] = [
  registerRoute('/components', () => import('./views/components.js')),
  registerRoute('/user/:user', () => import('./views/user/:user.js')),
  registerRoute('/', () => import('./views/index.js')),
  registerRoute('/hello', () => import('./views/hello.js')),
];
