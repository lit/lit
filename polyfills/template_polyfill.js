"use strict";
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
 *
 * A lightweight <template> polyfill that supports minimum features to cover
 * lit-html use cases. It provides an alternate route in case <template> is not
 * natively supported.
 * Please note that nested template, cloning template node and innerHTML getter
 * do NOT work with this polyfill.
 * If it can not fullfill your requirement, please consider using the full
 * polyfill: https://github.com/webcomponents/template
 */
if (typeof HTMLTemplateElement === 'undefined') {
    let contentDoc;
    if (typeof document.implementation.createHTMLDocument === 'function') {
        contentDoc = document.implementation.createHTMLDocument('template');
    }
    else {
        // Cobalt does not implement createHTMLDocument.
        contentDoc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
        const contentDocBody = document.createElementNS('http://www.w3.org/1999/xhtml', 'body');
        contentDoc.documentElement.appendChild(contentDocBody);
    }
    const upgrade = function (template) {
        template.content = contentDoc.createDocumentFragment();
        defineInnerHTML(template);
    };
    const defineInnerHTML = function (obj) {
        Object.defineProperty(obj, 'innerHTML', {
            set: function (text) {
                contentDoc.body.innerHTML = text;
                while (this.content.firstChild) {
                    this.content.removeChild(this.content.firstChild);
                }
                const body = contentDoc.body;
                while (body.firstChild) {
                    this.content.append(body.firstChild);
                }
            },
            configurable: true
        });
    };
    const capturedCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function createElement() {
        let el = capturedCreateElement.apply(this, arguments);
        if (el.localName === 'template') {
            el = capturedCreateElement.call(this, 'div');
            upgrade(el);
        }
        return el;
    };
}
//# sourceMappingURL=template_polyfill.js.map