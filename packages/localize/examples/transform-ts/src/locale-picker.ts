/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {getLocale} from './localization.js';
import {allLocales} from './generated/locale-codes.js';

const localeNames: {
  [L in typeof allLocales[number]]: string;
} = {
  en: 'English',
  'es-419': 'Español (Latinoamérica)‎',
  zh_CN: '中文 (简体)',
};

export class LocalePicker extends LitElement {
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

  localeChanged(event: Event) {
    const newLocale = (event.target as HTMLSelectElement).value;
    if (newLocale !== getLocale()) {
      const url = new URL(window.location.href);
      url.searchParams.set('locale', newLocale);
      window.location.assign(url.toString());
    }
  }
}
customElements.define('locale-picker', LocalePicker);
