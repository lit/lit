/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const escapePattern = /[&<>"']/g;

/**
 * Replaces characters which have special meaning in HTML (&<>"') with escaped
 * HTML entities ("&amp;", "&lt;", etc.).
 */
export const escapeHtml = (str: string) => {
  let match = escapePattern.exec(str);

  if (!match) {
    return str;
  }

  let escapeStr;
  let html = '';
  let lastIndex = 0;

  while (match) {
    switch (str.charCodeAt(match.index)) {
      // Character: "
      case 34:
        escapeStr = '&quot;';
        break;
      // Character: &
      case 38:
        escapeStr = '&amp;';
        break;
      // Character: '
      // Note &apos; was not defined in the HTML4 spec, and is not supported by
      // very old browsers like IE8, so a codepoint entity is used instead.
      case 39:
        escapeStr = '&#39;';
        break;
      // Character: <
      case 60:
        escapeStr = '&lt;';
        break;
      // Character: >
      case 62:
        escapeStr = '&gt;';
        break;
    }

    html += str.substring(lastIndex, match.index) + escapeStr;
    lastIndex = match.index + 1;
    match = escapePattern.exec(str);
  }

  escapePattern.lastIndex = 0;

  return lastIndex !== str.length - 1
    ? html + str.substring(lastIndex, str.length)
    : html;
};
