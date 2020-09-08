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
 * Configuration parameters for lit-localize when in runtime mode.
 */
export interface RuntimeConfiguration {
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
 * Configuration parameters for lit-localize when in transform mode.
 */
export interface TransformConfiguration {
  /**
   * Required locale code in which source templates in this project are written,
   * and the active locale.
   */
  sourceLocale: string;
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

/**
 * Name of the event dispatched to `window` whenever a locale change starts,
 * finishes successfully, or fails. Only relevant to runtime mode.
 *
 * The `detail` of this event is an object with a `status` string that can be:
 * "loading", "ready", or "error", along with the relevant locale code, and
 * error message if applicable.
 *
 * You can listen for this event to know when your application should be
 * re-rendered following a locale change. See also the Localized mixin, which
 * automatically re-renders LitElement classes using this event.
 */
export const LOCALE_STATUS_EVENT = 'lit-localize-status';

declare global {
  interface WindowEventMap {
    [LOCALE_STATUS_EVENT]: CustomEvent<LocaleStatusEventDetail>;
  }
}

/**
 * The possible details of the "lit-localize-status" event.
 */
export type LocaleStatusEventDetail = LocaleLoading | LocaleReady | LocaleError;

/**
 * Detail of the "lit-localize-status" event when a new locale has started to
 * load.
 *
 * A "loading" status can be followed by [1] another "loading" status (in the
 * case that a second locale is requested before the first one completed), [2] a
 * "ready" status, or [3] an "error" status.
 */
export interface LocaleLoading {
  status: 'loading';
  /** Code of the locale that has started loading. */
  loadingLocale: string;
}

/**
 * Detail of the "lit-localize-status" event when a new locale has successfully
 * loaded and is ready for rendering.
 *
 * A "ready" status can be followed only by a "loading" status.
 */
export interface LocaleReady {
  status: 'ready';
  /** Code of the locale that has successfully loaded. */
  readyLocale: string;
}

/**
 * Detail of the "lit-localize-status" event when a new locale failed to load.
 *
 * An "error" status can be followed only by a "loading" status.
 */
export interface LocaleError {
  status: 'error';
  /** Code of the locale that failed to load. */
  errorLocale: string;
  /** Error message from locale load failure. */
  errorMessage: string;
}

/**
 * Dispatch a "lit-localize-status" event to `window` with the given detail.
 */
function dispatchStatusEvent(detail: LocaleStatusEventDetail) {
  window.dispatchEvent(new CustomEvent(LOCALE_STATUS_EVENT, {detail}));
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
let loadingLocale: string | undefined;
let sourceLocale: string | undefined;
let validLocales: Set<string> | undefined;
let loadLocale: ((locale: string) => Promise<LocaleModule>) | undefined;
let configured = false;
let templates: TemplateMap | undefined;
let loading = new Deferred<void>();
// The loading promise must be initially resolved, because that's what we should
// return if the user immediately calls setLocale(sourceLocale).
loading.resolve();
let requestId = 0;

/**
 * Set configuration parameters for lit-localize when in runtime mode. Returns
 * an object with functions:
 *
 * - `getLocale`: Return the active locale code.
 * - `setLocale`: Set the active locale code.
 *
 * Throws if called more than once.
 */
export const configureLocalization: ((
  config: RuntimeConfiguration
) => {getLocale: typeof getLocale; setLocale: typeof setLocale}) & {
  _LIT_LOCALIZE_CONFIGURE_LOCALIZATION_?: never;
} = (config: RuntimeConfiguration) => {
  if (configured === true) {
    throw new Error('lit-localize can only be configured once');
  }
  configured = true;
  activeLocale = sourceLocale = config.sourceLocale;
  validLocales = new Set(config.targetLocales);
  validLocales.add(config.sourceLocale);
  loadLocale = config.loadLocale;
  return {getLocale, setLocale};
};

/**
 * Set configuration parameters for lit-localize when in transform mode. Returns
 * an object with function:
 *
 * - `getLocale`: Return the active locale code.
 *
 * Throws if called more than once.
 */
export const configureTransformLocalization: ((
  config: TransformConfiguration
) => {getLocale: typeof getLocale}) & {
  _LIT_LOCALIZE_CONFIGURE_TRANSFORM_LOCALIZATION_?: never;
} = (config: TransformConfiguration) => {
  if (configured === true) {
    throw new Error('lit-localize can only be configured once');
  }
  configured = true;
  activeLocale = sourceLocale = config.sourceLocale;
  return {getLocale};
};

/**
 * Return the active locale code.
 */
const getLocale: (() => string) & {
  _LIT_LOCALIZE_GET_LOCALE_?: never;
} = () => {
  return activeLocale;
};

/**
 * Set the active locale code, and begin loading templates for that locale using
 * the `loadLocale` function that was passed to `configureLocalization`. Returns
 * a promise that resolves when the next locale is ready to be rendered.
 *
 * Note that if a second call to `setLocale` is made while the first requested
 * locale is still loading, then the second call takes precedence, and the
 * promise returned from the first call will resolve when second locale is
 * ready. If you need to know whether a particular locale was loaded, check
 * `getLocale` after the promise resolves.
 *
 * Throws if the given locale is not contained by the configured `sourceLocale`
 * or `targetLocales`.
 */
const setLocale: ((newLocale: string) => Promise<void>) & {
  _LIT_LOCALIZE_SET_LOCALE_?: never;
} = (newLocale: string) => {
  if (newLocale === (loadingLocale ?? activeLocale)) {
    return loading.promise;
  }
  if (!validLocales || !loadLocale) {
    throw new Error('Internal error');
  }
  if (!validLocales.has(newLocale)) {
    throw new Error('Invalid locale code');
  }
  requestId++;
  const thisRequestId = requestId;
  loadingLocale = newLocale;
  if (loading.settled) {
    loading = new Deferred();
  }
  dispatchStatusEvent({status: 'loading', loadingLocale: newLocale});
  const localePromise: Promise<Partial<LocaleModule>> =
    newLocale === sourceLocale
      ? // We could switch to the source locale syncronously, but we prefer to
        // queue it on a microtask so that switching locales is consistently
        // asynchronous.
        Promise.resolve({templates: undefined})
      : loadLocale(newLocale);
  localePromise.then(
    (mod) => {
      if (requestId === thisRequestId) {
        activeLocale = newLocale;
        loadingLocale = undefined;
        templates = mod.templates;
        dispatchStatusEvent({status: 'ready', readyLocale: newLocale});
        loading.resolve();
      }
      // Else another locale was requested in the meantime. Don't resolve or
      // reject, because the newer load call is going to use the same promise.
      // Note the user can call getLocale() after the promise resolves if they
      // need to check if the locale is still the one they expected to load.
    },
    (err) => {
      if (requestId === thisRequestId) {
        dispatchStatusEvent({
          status: 'error',
          errorLocale: newLocale,
          errorMessage: err.toString(),
        });
        loading.reject(err);
      }
    }
  );
  return loading.promise;
};

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
  if (templates) {
    const localized = templates[id];
    if (localized) {
      template = localized;
    }
  }
  if (typeof template === 'function') {
    return template(...params);
  }
  return template;
}

export const msg: typeof _msg & {_LIT_LOCALIZE_MSG_?: never} = _msg;
