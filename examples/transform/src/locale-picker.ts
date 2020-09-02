import {LitElement, html} from 'lit-element';
import {getLocale} from './localization.js';

const locales = ['en', 'es-419', 'zh_CN'] as const;

const localeNames: {
  [L in typeof locales[number]]: string;
} = {
  en: 'English',
  'es-419': 'Español (Latinoamérica)‎',
  zh_CN: '中文 (简体)',
};

export class LocalePicker extends LitElement {
  render() {
    return html`
      <select @change=${this.localeChanged}>
        ${locales.map(
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
