/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {TemplateResult} from 'lit-html';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Runtime configuration parameters for lit-localize.
 */
export interface Configuration {
  /**
   * Required locale code in which source templates in this project are written,
   * and the initial active locale.
   */
  sourceLocale: string;

  /**
   * Required locale codes that are supported by this project. Should not
   * include the `sourceLocale` code.
   */
  targetLocales: Iterable<string>;

  /**
   * Required function that returns a promise of the localized templates for the
   * given locale code. For security, this function will only ever be called
   * with a `locale` that is contained by `targetLocales`.
   */
  loadLocale: (locale: string) => Promise<LocaleModule>;
}

/**
 * The template-like types that can be passed to `msg`.
 */
export type TemplateLike =
  | string
  | TemplateResult
  | ((...args: any[]) => string)
  | ((...args: any[]) => TemplateResult);

/**
 * A mapping from template ID to template.
 */
export type TemplateMap = {[id: string]: TemplateLike};

/**
 * The expected exports of a locale module.
 */
export interface LocaleModule {
  templates: TemplateMap;
}

class Deferred<T> {
  readonly promise: Promise<T>;
  private _resolve!: (value: T) => void;
  private _reject!: (error: Error) => void;
  settled = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve(value: T) {
    this.settled = true;
    this._resolve(value);
  }

  reject(error: Error) {
    this.settled = true;
    this._reject(error);
  }
}

let activeLocale = '';
let sourceLocale: string | undefined;
let validLocales: Set<string> | undefined;
let loadLocale: ((locale: string) => Promise<LocaleModule>) | undefined;
let templates: TemplateMap | undefined;
let loading = new Deferred<void>();

/**
 * Whenever the locale changes and templates have finished loading, an event by
 * this name ("lit-localize-locale-changed") is dispatched to window.
 *
 * You can listen for this event to know when your application should be
 * re-rendered following a locale change. See also the Localized mixin, which
 * automatically re-renders LitElement classes using this event.
 */
export const LOCALE_CHANGED_EVENT: string & {
  _LIT_LOCALIZE_LOCALE_CHANGED_EVENT_?: never;
} = 'lit-localize-locale-changed';

/**
 * Set runtime configuration parameters for lit-localize. This function must be
 * called before using any other lit-localize function.
 */
export const configureLocalization: ((config: Configuration) => void) & {
  _LIT_LOCALIZE_CONFIGURE_LOCALIZATION_?: never;
} = (config: Configuration) => {
  activeLocale = sourceLocale = config.sourceLocale;
  validLocales = new Set(config.targetLocales);
  validLocales.add(config.sourceLocale);
  loadLocale = config.loadLocale;
};

/**
 * Return the active locale code. Returns empty string if lit-localize has not
 * yet been configured.
 */
export const getLocale: (() => string) & {
  _LIT_LOCALIZE_GET_LOCALE_?: never;
} = () => {
  return activeLocale;
};

/**
 * Set the active locale code, and begin loading templates for that locale using
 * the `loadLocale` function that was passed to `configureLocalization`.
 */
export const setLocale: ((newLocale: string) => void) & {
  _LIT_LOCALIZE_SET_LOCALE_?: never;
} = (newLocale: string) => {
  if (
    newLocale === activeLocale ||
    !validLocales ||
    !validLocales.has(newLocale) ||
    !loadLocale
  ) {
    return;
  }
  activeLocale = newLocale;
  templates = undefined;
  if (loading.settled) {
    loading = new Deferred();
  }
  if (newLocale === sourceLocale) {
    loading.resolve();
    window.dispatchEvent(new Event(LOCALE_CHANGED_EVENT));
  } else {
    loadLocale(newLocale).then(
      (mod) => {
        if (newLocale === activeLocale) {
          templates = mod.templates;
          loading.resolve();
          window.dispatchEvent(new Event(LOCALE_CHANGED_EVENT));
        }
        // Else another locale was requested in the meantime. Don't resolve or
        // reject, because the newer load call is going to use the same promise.
        // Note the user can call getLocale() after the promise resolves if they
        // need to check if the locale is still the one they expected to load.
      },
      (err) => {
        if (newLocale === activeLocale) {
          loading.reject(err);
        }
      }
    );
  }
};

/**
 * Return a promise that is resolved when the next set of templates are loaded
 * and available for rendering.
 */
export const localeReady: (() => Promise<void>) & {
  _LIT_LOCALIZE_LOCALE_READY_?: never;
} = () => loading.promise;

/**
 * Make a string or lit-html template localizable.
 *
 * @param id A project-wide unique identifier for this template.
 * @param template A string, a lit-html template, or a function that returns
 * either a string or lit-html template.
 * @param args In the case that `template` is a function, it is invoked with
 * the 3rd and onwards arguments to `msg`.
 */
export function _msg(id: string, template: string): string;

export function _msg(id: string, template: TemplateResult): TemplateResult;

export function _msg<F extends (...args: any[]) => string>(
  id: string,
  fn: F,
  ...params: Parameters<F>
): string;

export function _msg<F extends (...args: any[]) => TemplateResult>(
  id: string,
  fn: F,
  ...params: Parameters<F>
): TemplateResult;

export function _msg(
  id: string,
  template: TemplateLike,
  ...params: any[]
): string | TemplateResult {
  if (activeLocale !== sourceLocale && templates) {
    const localized = templates[id];
    if (localized) {
      template = localized;
    }
  }
  if (template instanceof Function) {
    return template(...params);
  }
  return template;
}

export const msg: typeof _msg & {_LIT_LOCALIZE_MSG_?: never} = _msg;
