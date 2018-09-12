"use strict";
if (typeof HTMLTemplateElement === 'undefined') {
    const capturedCreateElement = Document.prototype.createElement;
    //const capturedCloneNode = Node.prototype.cloneNode;
    const contentDoc = document.implementation.createHTMLDocument('template');
    //const contentDoc = document.implementation.createDocument(
    //'http://www.w3.org/1999/xhtml',
    //'html',
    //null
    //);
    //const contentDocBody = document.createElementNS(
    //'http://www.w3.org/1999/xhtml',
    //'body'
    //);
    //contentDoc.documentElement.appendChild(contentDocBody);
    const PolyfilledHTMLTemplateElement = function () { };
    /**
     * Provides a minimal shim for the <template> element.
     */
    PolyfilledHTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
    const defineInnerHTML = function defineInnerHTML(obj) {
        Object.defineProperty(obj, 'innerHTML', {
            set: function (text) {
                console.log(text);
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
    defineInnerHTML(PolyfilledHTMLTemplateElement.prototype);
    PolyfilledHTMLTemplateElement.decorate = function (template) {
        // if the template is decorated or not in HTML namespace, return fast.
        if (template.content ||
            template.namespaceURI !== document.documentElement.namespaceURI) {
            return;
        }
        template.content = contentDoc.createDocumentFragment();
        let child;
        while ((child = template.firstChild)) {
            template.content.appendChild(child);
        }
        template.__proto__ = PolyfilledHTMLTemplateElement.prototype;
    };
    Document.prototype.createElement = function createElement() {
        let el = capturedCreateElement.apply(this, arguments);
        if (el.localName === 'template') {
            el = capturedCreateElement.call(this, 'template');
            PolyfilledHTMLTemplateElement.decorate(el);
        }
        return el;
    };
    window.HTMLTemplateElement = PolyfilledHTMLTemplateElement;
}
//# sourceMappingURL=template_polyfill.js.map