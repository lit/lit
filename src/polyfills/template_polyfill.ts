import { reparentNodes } from '../lib/dom.js';

if (typeof HTMLTemplateElement === 'undefined') {
  const capturedCreateElement = Document.prototype.createElement;
  const contentDoc = document.implementation.createDocument(
    'http://www.w3.org/1999/xhtml',
    'html',
    null
  );
  const contentDocBody = document.createElementNS(
    'http://www.w3.org/1999/xhtml',
    'body'
  );
  contentDoc.documentElement.appendChild(contentDocBody);

  const PolyfilledHTMLTemplateElement: any = function() {};
  /**
   * Provides a minimal shim for the <template> element.
   */
  PolyfilledHTMLTemplateElement.prototype = Object.create(
    HTMLElement.prototype
  );

  PolyfilledHTMLTemplateElement.decorate = function(template: any) {
    // if the template is decorated or not in HTML namespace, return fast.
    if (
      template.content ||
      template.namespaceURI !== document.documentElement.namespaceURI
    ) {
      return;
    }
    template.content = contentDoc.createDocumentFragment();
    reparentNodes(template.content, template.firstChild);
    template.__proto__ = PolyfilledHTMLTemplateElement.prototype;
  };

  Document.prototype.createElement = function createElement() {
    const el = capturedCreateElement.apply(this, arguments);
    if (el.localName === 'template') {
      PolyfilledHTMLTemplateElement.decorate(el);
    }
    return el;
  };

  (window as any).HTMLTemplateElement = PolyfilledHTMLTemplateElement;
}
