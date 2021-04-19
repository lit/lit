/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {TemplateResult, ReactiveController, ReactiveControllerHost} from 'lit';
import {generateMsgId} from './id-generation.js';
import type {ReactiveElement} from '@lit/reactive-element';
import type {
  Constructor,
  ClassDescriptor,
} from '@lit/reactive-element/decorators/base.js';

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
export type TemplateLike = string | TemplateResult | StrResult;

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

// Misfiring eslint rule
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export interface StrResult {
  strTag: true;
  strings: TemplateStringsArray;
  values: unknown[];
}

/**
 * Tag that allows expressions to be used in localized non-HTML template
 * strings.
 *
 * Example: msg(str`Hello ${this.user}!`);
 *
 * The Lit html tag can also be used for this purpose, but HTML will need to be
 * escaped, and there is a small overhead for HTML parsing.
 *
 * Untagged template strings with expressions aren't supported by lit-localize
 * because they don't allow for values to be captured at runtime.
 */
const _str = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): StrResult => ({
  strTag: true,
  strings,
  values,
});

export const str: typeof _str & {_LIT_LOCALIZE_STR_?: never} = _str;

export interface MsgOptions {
  /**
   * Optional project-wide unique identifier for this template. If omitted, an
   * id will be automatically generated from the template strings.
   */
  id?: string;

  /**
   * Optional description of this message.
   */
  desc?: string;
}

/**
 * Make a string or lit-html template localizable.
 *
 * @param template A string, a lit-html template, or a function that returns
 * either a string or lit-html template.
 * @param options Optional configuration object with the following properties:
 *   - id: Optional project-wide unique identifier for this template. If
 *     omitted, an id will be automatically generated from the template strings.
 *   - desc: Optional description
 */
export function _msg(template: string, options?: MsgOptions): string;
export function _msg(template: StrResult, options?: MsgOptions): string;

export function _msg(
  template: TemplateResult,
  options?: MsgOptions
): TemplateResult;

export function _msg(
  template: TemplateLike,
  options?: MsgOptions
): string | TemplateResult {
  if (templates) {
    const id = options?.id ?? generateId(template);
    const localized = templates[id];
    if (localized) {
      if (typeof localized === 'string') {
        // E.g. "Hello World!"
        return localized;
      } else if ('strTag' in localized) {
        // E.g. str`Hello ${name}!`
        //
        // Localized templates have ${number} in place of real template
        // expressions. They can't have real template values, because the
        // variable scope would be wrong. The number tells us the index of the
        // source value to substitute in its place, because expressions can be
        // moved to a different position during translation.
        return joinStringsAndValues(
          localized.strings,
          // Cast `template` because its type wasn't automatically narrowed (but
          // we know it must be the same type as `localized`).
          (template as TemplateResult).values,
          localized.values as number[]
        );
      } else {
        // E.g. html`Hello <b>${name}</b>!`
        //
        // We have to keep our own mapping of expression ordering because we do
        // an in-place update of `values`, and otherwise we'd lose ordering for
        // subsequent renders.
        let order = expressionOrders.get(localized);
        if (order === undefined) {
          order = localized.values as number[];
          expressionOrders.set(localized, order);
        }
        // Cast `localized.values` because it's readonly.
        (localized as {
          values: TemplateResult['values'];
        }).values = order.map((i) => (template as TemplateResult).values[i]);
        return localized;
      }
    }
  }
  if (typeof template !== 'string' && 'strTag' in template) {
    // E.g. str`Hello ${name}!` in original source locale.
    return joinStringsAndValues(template.strings, template.values);
  }
  return template;
}

/**
 * Render the result of a `str` tagged template to a string. Note we don't need
 * to do this for Lit templates, since Lit itself handles rendering.
 */
const joinStringsAndValues = (
  strings: TemplateStringsArray,
  values: Readonly<unknown[]>,
  valueOrder?: number[]
) => {
  let concat = strings[0];
  for (let i = 1; i < strings.length; i++) {
    concat += values[valueOrder ? valueOrder[i - 1] : i - 1];
    concat += strings[i];
  }
  return concat;
};

const expressionOrders = new WeakMap<TemplateResult, number[]>();

const hashCache = new Map<TemplateStringsArray | string, string>();

function generateId(template: TemplateLike): string {
  const strings = typeof template === 'string' ? template : template.strings;
  let id = hashCache.get(strings);
  if (id === undefined) {
    id = generateMsgId(
      strings,
      typeof template !== 'string' && !('strTag' in template)
    );
    hashCache.set(strings, id);
  }
  return id;
}

export const msg: typeof _msg & {_LIT_LOCALIZE_MSG_?: never} = _msg;

class LocalizeController implements ReactiveController {
  host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
  }

  private readonly __litLocalizeEventHandler = (
    event: WindowEventMap[typeof LOCALE_STATUS_EVENT]
  ) => {
    if (event.detail.status === 'ready') {
      this.host.requestUpdate();
    }
  };

  hostConnected() {
    window.addEventListener(
      LOCALE_STATUS_EVENT,
      this.__litLocalizeEventHandler
    );
  }

  hostDisconnected() {
    window.removeEventListener(
      LOCALE_STATUS_EVENT,
      this.__litLocalizeEventHandler
    );
  }
}

/**
 * Re-render the given LitElement whenever a new active locale has loaded.
 *
 * See also {@link localized} for the same functionality as a decorator.
 *
 * When using lit-localize in transform mode, calls to this function are
 * replaced with undefined.
 *
 * Usage:
 *
 *   import {LitElement, html} from 'lit';
 *   import {msg, updateWhenLocaleChanges} from '@lit/localize';
 *
 *   class MyElement extends LitElement {
 *     constructor() {
 *       super();
 *       updateWhenLocaleChanges(this);
 *     }
 *
 *     render() {
 *       return html`<b>${msg('Hello World')}</b>`;
 *     }
 *   }
 */
const _updateWhenLocaleChanges = (host: ReactiveControllerHost) =>
  host.addController(new LocalizeController(host));

export const updateWhenLocaleChanges: typeof _updateWhenLocaleChanges & {
  _LIT_LOCALIZE_CONTROLLER_FN_?: never;
} = _updateWhenLocaleChanges;

/**
 * Class decorator to enable re-rendering the given LitElement whenever a new
 * active locale has loaded.
 *
 * See also {@link updateWhenLocaleChanges} for the same functionality without
 * the use of decorators.
 *
 * When using lit-localize in transform mode, applications of this decorator are
 * removed.
 *
 * Usage:
 *
 *   import {LitElement, html} from 'lit';
 *   import {customElement} from 'lit/decorators.js';
 *   import {msg, localized} from '@lit/localize';
 *
 *   @localized()
 *   @customElement('my-element')
 *   class MyElement extends LitElement {
 *     render() {
 *       return html`<b>${msg('Hello World')}</b>`;
 *     }
 *   }
 */
const _localized = () => (
  classOrDescriptor: Constructor<ReactiveElement> | ClassDescriptor
) =>
  typeof classOrDescriptor === 'function'
    ? legacyLocalized((classOrDescriptor as unknown) as typeof ReactiveElement)
    : standardLocalized(classOrDescriptor);

export const localized: typeof _localized & {
  _LIT_LOCALIZE_DECORATOR_?: never;
} = _localized;

const standardLocalized = ({kind, elements}: ClassDescriptor) => {
  return {
    kind,
    elements,
    finisher(clazz: typeof ReactiveElement) {
      clazz.addInitializer(updateWhenLocaleChanges);
    },
  };
};

const legacyLocalized = (clazz: typeof ReactiveElement) => {
  clazz.addInitializer(updateWhenLocaleChanges);
  return clazz as any;
};
