import {configureLocalization} from 'lit-localize';

export const {getLocale, setLocale} = configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['es-419', 'zh_CN'],
  loadLocale: (locale: string) => import(`/lib/locales/${locale}.js`),
});

export const setLocaleFromUrl = async () => {
  const url = new URL(window.location.href);
  const locale = url.searchParams.get('locale') || 'en';
  await setLocale(locale);
};
