/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * A lightweight <template> polyfill that supports minimum features to cover
 * lit-html use cases. It provides an alternate route in case <template> is not
 * natively supported.
 * Please note that nested template, cloning template node and innerHTML getter
 * do NOT work with this polyfill.
 * If it can not fullfill your requirement, please consider using the full
 * polyfill: https://github.com/webcomponents/template
 */
export const initTemplatePolyfill = (forced = false) => {
  if (typeof HTMLTemplateElement !== 'undefined' && !forced) {
    return;
  }
  const contentDoc = document.implementation.createHTMLDocument('template');

  // tslint:disable-next-line:no-any
  const upgrade = (template: any) => {
    template.content = contentDoc.createDocumentFragment();
    Object.defineProperty(template, 'innerHTML', {
      set: function(text) {
        contentDoc.body.innerHTML = text;
        const content = (this as HTMLTemplateElement).content;
        while (content.firstChild) {
          content.removeChild(content.firstChild);
        }
        const body = contentDoc.body;
        while (body.firstChild) {
          content.appendChild(body.firstChild);
        }
      },
      configurable: true
    });
  };

  const capturedCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function createElement(
      tagName: string, options?: ElementCreationOptions) {
    let el = capturedCreateElement.call(this, tagName, options);
    if (el.localName === 'template') {
      el = capturedCreateElement.call(this, 'div');
      upgrade(el);
    }
    return el;
  };
};
