/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Elements and their special properties that should be reflected to attributes
 * when set.
 *
 * Each item in the array takes the following format:
 *
 * Item 0:
 *    Array of [property name, reflected attribute name]
 *    or
 *    property name (if reflected attribute name is identical).
 * Item 1:
 *    Array of tag names which reflect the property
 *
 * List of attributes and which elements they apply is sourced from
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
 *
 * Commented elements were empirically found to not reflect from an associated
 * property.
 */
// prettier-ignore
const reflectedAttributesSource: (string | string[])[][] = [
  ['accept', [/*'form',*/ 'input']],
  [['accept-charset', 'acceptCharset'], ['form']],
  [['accesskey', 'accessKey'], ['*']],
  ['action', ['form']],
  ['align', [/*'applet',*/ 'caption', 'col', 'colgroup', 'hr', 'iframe', 'img', 'table', 'tbody', 'td', 'tfoot' , 'th', 'thead', 'tr']],
  ['allow', ['iframe']],
  ['alt', [/*'applet',*/ 'area', 'img', 'input']],
  ['async', ['script']],
  ['autocapitalize', ['*']],
  ['autocomplete', ['form', 'input', 'select', 'textarea']],
  ['autofocus', ['button', 'input', 'keygen', 'select', 'textarea']],
  ['autoplay', ['audio', 'video']],
  ['background', ['body', /*'table', 'td', 'th'*/]],
  [['bgcolor', 'bgColor'], ['body', /*'col', 'colgroup',*/ 'marquee', 'table', /*'tbody', 'tfoot',*/ 'td', 'th', 'tr']],
  ['border', ['img', 'object', 'table']],
  ['buffered', [/*'audio', 'video'*/]],
  ['capture', [/*'input'*/]],
  ['challenge', [/*'keygen'*/]],
  ['charset', [/*'meta',*/ 'script']],
  ['checked', [/*'command',*/ 'input']],
  ['cite', ['blockquote', 'del', 'ins', 'q']],
  [['class', 'className'], ['*']],
  ['code', [/*'applet'*/]],
  ['codebase', [/*'applet'*/]],
  ['color', [/*'basefont',*/ 'font', 'hr']],
  ['cols', ['textarea']],
  [['colspan', 'colSpan'], ['td', 'th']],
  ['content', ['meta']],
  [['contenteditable', 'contentEditable'], ['*']],
  [['contextmenu'], [/*'*'*/]],
  ['controls', ['audio', 'video']],
  ['coords', ['area']],
  [['crossorigin', 'crossOrigin'], ['audio', 'img', 'link', 'script', 'video']],
  ['csp', ['iframe']],
  ['data', ['object']],
  [['datetime', 'dateTime'], ['del', 'ins', 'time']],
  ['decoding', ['img']],
  ['default', ['track']],
  ['defer', ['script']],
  ['dir', ['*']],
  [['dirname', 'dirName'], ['input', 'textarea']],
  ['disabled', [/*'command',*/ 'button', 'fieldset', 'input', /*'keygen',*/ 'optgroup', 'option', 'select', 'textarea']],
  ['download', ['a', 'area']],
  ['draggable', ['*']],
  ['enctype', ['form']],
  [['enterkeyhint', 'enterKeyHint'], ['textarea', 'contenteditable']],
  ['for', [/*'label', 'output'*/]],
  ['form', [/*'button', 'fieldset', 'input', 'keygen', 'label', 'meter', 'object', 'output', 'progress', 'select', 'textarea'*/]],
  [['formaction', 'formAction'], ['input', 'button']],
  [['formenctype', 'formEnctype'], ['button', 'input']],
  [['formmethod', 'formMethod'], ['button', 'input']],
  [['formnovalidate', 'formNoValidate'], ['button', 'input']],
  [['formtarget', 'formTarget'], ['button', 'input']],
  ['headers', ['td', 'th']],
  ['height', ['canvas', 'embed', 'iframe', 'img', 'input', 'object', 'video']],
  ['hidden', ['*']],
  ['high', ['meter']],
  ['href', ['a', 'area', 'base', 'link']],
  ['hreflang', ['a', /*'area',*/ 'link']],
  [['http-equiv', 'httpEquiv'], ['meta']],
  ['icon', [/*'command'*/]],
  ['id', ['*']],
  ['importance', [/*'iframe', 'img', 'link', 'script'*/]],
  ['integrity', ['link', 'script']],
  ['intrinsicsize', [/*'img'*/]],
  [['inputmode', 'inputMode'], ['textarea', 'contenteditable']],
  [['ismap', 'isMap'], ['img']],
  ['itemprop', [/*'*'*/]],
  ['keytype', [/*'keygen'*/]],
  ['kind', ['track']],
  ['label', ['optgroup', 'option', 'track']],
  ['lang', ['*']],
  ['language', [/*'script'*/]],
  ['loading', ['img', 'iframe']],
  ['list', [/*'input'*/]],
  ['loop', ['audio', /*'bgsound',*/ 'marquee', 'video']],
  ['low', ['meter']],
  ['manifest', [/*'html'*/]],
  ['max', ['input', 'meter', 'progress']],
  [['maxlength', 'maxLength'], ['input', 'textarea']],
  [['minlength', 'minLength'], ['input', 'textarea']],
  ['media', [/*'a', 'area',*/ 'link', 'source', 'style']],
  ['method', ['form']],
  ['min', ['input', 'meter']],
  ['multiple', ['input', 'select']],
  ['muted', ['audio', 'video']],
  ['name', ['button', 'form', 'fieldset', 'iframe', 'input', /*'keygen',*/ 'object', 'output', 'select', 'textarea', 'map', 'meta', 'param']],
  [['novalidate', 'noValidate'], ['form']],
  ['open', ['details']],
  ['optimum', ['meter']],
  ['pattern', ['input']],
  ['ping', ['a', 'area']],
  ['placeholder', ['input', 'textarea']],
  ['poster', ['video']],
  ['preload', ['audio', 'video']],
  ['radiogroup', [/*'command'*/]],
  [['readonly', 'readOnly'], ['input', 'textarea']],
  [['referrerpolicy', 'referrerPolicy'], ['a', 'area', 'iframe', 'img', 'link', 'script']],
  ['rel', ['a', 'area', 'link']],
  ['required', ['input', 'select', 'textarea']],
  ['reversed', ['ol']],
  ['rows', ['textarea']],
  [['rowspan', 'rowSpan'], ['td', 'th']],
  ['sandbox', ['iframe']],
  ['scope', ['th']],
  ['scoped', [/*'style'*/]],
  ['selected', ['option']],
  ['shape', ['a', 'area']],
  ['size', ['input', 'select']],
  ['sizes', ['link', 'img', 'source']],
  ['slot', ['*']],
  ['span', ['col', 'colgroup']],
  ['spellcheck', ['*']],
  ['src', ['audio', 'embed', 'iframe', 'img', 'input', 'script', 'source', 'track', 'video']],
  ['srcdoc', ['iframe']],
  ['srclang', ['track']],
  ['srcset', ['img', 'source']],
  ['start', ['ol']],
  ['step', ['input']],
  ['style', ['*']],
  ['summary', ['table']],
  [['tabindex', 'tabIndex'], ['*']],
  ['target', ['a', 'area', 'base', 'form']],
  ['title', ['*']],
  ['translate', [/*'*'*/]], //TODO(kschaaf): 'translate' boolean property maps to 'yes'/'no'
  ['type', ['button', 'input', /*'command',*/ 'embed', 'object', 'script', 'source', 'style', /*'menu'*/]],
  [['usemap', 'useMap'], ['img', 'input', 'object']],
  ['value', ['button', 'data', 'input', 'li', 'meter', 'option', 'progress', 'param']],
  ['width', ['canvas', 'embed', 'iframe', 'img', 'input', 'object', 'video']],
  ['wrap', ['textarea']]
];

/**
 * Construct reflectedAttributes as nested maps for efficient lookup.
 */
const reflectedAttributes = new Map<string, Map<string, string>>();
const addPropertyForElement = (
  elementName: string,
  attributeName: string,
  propertyName: string
) => {
  if (reflectedAttributes.has(elementName)) {
    reflectedAttributes.get(elementName)!.set(propertyName, attributeName);
  } else {
    reflectedAttributes.set(
      elementName,
      new Map([[propertyName, attributeName]])
    );
  }
};
for (const [attr, elements] of reflectedAttributesSource) {
  for (let elementName of elements) {
    elementName = elementName.toUpperCase();
    if (attr instanceof Array) {
      // Property has a different attribute name.
      addPropertyForElement(elementName, attr[0], attr[1]);
    } else {
      addPropertyForElement(elementName, attr, attr);
    }
  }
}

/**
 * Return the attribute name that reflects from the given property
 * name on the given element.
 *
 * Example: for all elements, the property 'className' reflects to
 * the 'class' attribute, so:
 * reflectedAttributeName('div', 'className') returns 'class'
 */
export const reflectedAttributeName = (
  elementName: string,
  propertyName: string
): string | undefined => {
  const attributes = reflectedAttributes.get(elementName);
  if (attributes !== undefined && attributes.has(propertyName)) {
    return attributes.get(propertyName);
  } else {
    return reflectedAttributes.get('*')!.get(propertyName);
  }
};
