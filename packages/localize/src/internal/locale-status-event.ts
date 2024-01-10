/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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
