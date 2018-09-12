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
        //delete template.content;
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
    //PolyfilledHTMLTemplateElement._cloneNode = function(
    //template: any,
    //deep: boolean
    //) {
    //const clone = capturedCloneNode.call(template, false);
    //this.decorate(clone);
    //if (deep) {
    //clone.content.appendChild(capturedCloneNode.call(template.content, true));
    //fixClonedDom(clone.content, template.content);
    //}
    //return clone;
    //};
    //const fixClonedDom = function(clone: any, source: any) {
    //// do nothing if cloned node is not an element
    //if (!source.querySelectorAll) return;
    //// these two lists should be coincident
    //const s$ = source.querySelectorAll('template');
    //if (s$.length === 0) {
    //return;
    //}
    //const t$ = clone.querySelectorAll('template');
    //for (let i = 0, l = t$.length, t, s; i < l; i++) {
    //s = s$[i];
    //t = t$[i];
    //PolyfilledHTMLTemplateElement.decorate(s);
    //t.parentNode.replaceChild(cloneNode.call(s, true), t);
    //}
    //};
    //const cloneNode = (Node.prototype.cloneNode = function(deep: boolean) {
    //let dom;
    //if (
    //this.nodeType === Node.ELEMENT_NODE &&
    //this.localName === 'template' &&
    //this.namespaceURI === document.documentElement.namespaceURI
    //) {
    //dom = PolyfilledHTMLTemplateElement._cloneNode(this, deep);
    //} else {
    //dom = capturedCloneNode.call(this, deep);
    //}
    //if (deep) {
    //fixClonedDom(dom, this);
    //}
    //return dom;
    //});
    Document.prototype.createElement = function createElement() {
        let el = capturedCreateElement.apply(this, arguments);
        if (el.localName === 'template') {
            el = capturedCreateElement.call(this, 'div');
            PolyfilledHTMLTemplateElement.decorate(el);
        }
        return el;
    };
    window.HTMLTemplateElement = PolyfilledHTMLTemplateElement;
}
//# sourceMappingURL=template_polyfill.js.map