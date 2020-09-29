import{UpdatingElement as t}from"./updating-element.js";export{UpdatingElement,defaultConverter,notEqual}from"./updating-element.js";import{render as e}from"lit-html";export*from"lit-html";export{CSSResult,css,supportsAdoptingStyleSheets,unsafeCSS}from"./css-tag.js";import{LitElement as o}from"./lit-element.js";export{LitElement}from"./lit-element.js";
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
 */if(void 0!==window.ShadyCSS&&!window.ShadyCSS.nativeShadow){o.render=(t,o,i)=>{console.log("Note, this should be shady-render."),e(t,o,i)};const i=t.prototype.connectedCallback;o.prototype.connectedCallback=function(){i.call(this),this.hasUpdated&&window.ShadyCSS.styleElement(this)},o.prototype.adoptStyles=function(t){window.ShadowRoot&&this.renderRoot instanceof window.ShadowRoot&&window.ShadyCSS.ScopingShim.prepareAdoptedCssText(t.map(t=>t.cssText),this.localName)}}
//# sourceMappingURL=lit-element-polyfill.js.map
