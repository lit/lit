/* eslint-disable import/no-extraneous-dependencies */
import {installWindowOnGlobal} from '@lit-labs/ssr/lib/dom-shim.js';
installWindowOnGlobal();

if (!(globalThis as unknown as {URLPattern: {}}).URLPattern) {
  await import('urlpattern-polyfill');
}
