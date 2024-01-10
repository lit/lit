/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {setLocaleFromUrl} from './localization.js';
import {LOCALE_STATUS_EVENT} from '@lit/localize';
import {html, render} from 'lit';
import './locale-picker.js';
import './x-greeter.js';
import '@material/mwc-circular-progress';

const main = document.querySelector('main')!;
const spinner = document.querySelector('#spinner')!;

// Update the locale to match the URL when the user moves backwards or forwards
// through history.
window.addEventListener('popstate', () => {
  setLocaleFromUrl();
});

// Display a spinner whenever a new locale is loading.
window.addEventListener(LOCALE_STATUS_EVENT, ({detail}) => {
  if (detail.status === 'loading') {
    console.log(`Loading new locale: ${detail.loadingLocale}`);
    spinner.removeAttribute('hidden');
  } else if (detail.status === 'ready') {
    console.log(`Loaded new locale: ${detail.readyLocale}`);
    spinner.setAttribute('hidden', '');
  } else if (detail.status === 'error') {
    console.error(
      `Error loading locale ${detail.errorLocale}: ` + detail.errorMessage
    );
    spinner.setAttribute('hidden', '');
  }
});

(async () => {
  try {
    // Defer first render until our initial locale is ready, to avoid a flash of
    // the wrong locale.
    await setLocaleFromUrl();
  } catch (e) {
    // Either the URL locale code was invalid, or there was a problem loading
    // the locale module.
    console.error(`Error loading locale: ${(e as Error).message}`);
  }
  render(html` <x-greeter></x-greeter> `, main);
})();
