/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {getLocale, setLocaleFromUrl} from './localization.js';
import {allLocales} from './generated/locale-codes.js';
import {updateWhenLocaleChanges} from '@lit/localize';

const localeNames = {
  en: 'English',
  'es-419': 'Español (Latinoamérica)‎',
  zh_CN: '中文 (简体)',
};

// Note we use updateWhenLocaleChanges here so that we're always up to date with
// the active locale (the result of getLocale()) when the locale changes via a
// history navigation.
export class LocalePicker extends LitElement {
  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  render() {
    return html`
      <select @change=${this.localeChanged}>
        ${allLocales.map(
          (locale) =>
            html`<option value=${locale} ?selected=${locale === getLocale()}>
              ${localeNames[locale]}
            </option>`
        )}
      </select>
    `;
  }

  localeChanged(event) {
    const newLocale = event.target.value;
    if (newLocale !== getLocale()) {
      const url = new URL(window.location.href);
      url.searchParams.set('locale', newLocale);
      window.history.pushState(null, '', url.toString());
      setLocaleFromUrl();
    }
  }
}
customElements.define('locale-picker', LocalePicker);
