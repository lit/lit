!function(i){"function"==typeof define&&define.amd?define(i):i()}((function(){"use strict";var i;i=function(){!function(i){"function"==typeof define&&define.amd?define(i):i()}((function(){
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
var i,n,o="__scoped";null!==(i=(n=globalThis).reactiveElementPlatformSupport)&&void 0!==i||(n.reactiveElementPlatformSupport=function(i){var n=i.ReactiveElement;if(void 0!==window.ShadyCSS&&(!window.ShadyCSS.nativeShadow||window.ShadyCSS.ApplyShim)){var t=n.prototype;window.ShadyDOM&&window.ShadyDOM.inUse&&!0===window.ShadyDOM.noPatch&&window.ShadyDOM.patchElementProto(t);var d=t.createRenderRoot;t.createRenderRoot=function(){var i,n,t,v=this.localName;if(window.ShadyCSS.nativeShadow)return d.call(this);if(!this.constructor.hasOwnProperty(o)){this.constructor[o]=!0;var e=this.constructor.elementStyles.map((function(i){return i instanceof CSSStyleSheet?Array.from(i.cssRules).reduce((function(i,n){return i+n.cssText}),""):i.cssText}));null===(n=null===(i=window.ShadyCSS)||void 0===i?void 0:i.ScopingShim)||void 0===n||n.prepareAdoptedCssText(e,v),void 0===this.constructor.N&&window.ShadyCSS.prepareTemplateStyles(document.createElement("template"),v)}return null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions)};var v=t.connectedCallback;t.connectedCallback=function(){v.call(this),this.hasUpdated&&window.ShadyCSS.styleElement(this)};var e=t.H;t.H=function(i){var n=!this.hasUpdated;e.call(this,i),n&&window.ShadyCSS.styleElement(this)}}})}));
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
var i,n,o,t,d=new Set,v=new Map;null!==(i=(n=globalThis).litHtmlPlatformSupport)&&void 0!==i||(n.litHtmlPlatformSupport=function(i,n){var o,t;if(void 0!==window.ShadyCSS&&(!window.ShadyCSS.nativeShadow||window.ShadyCSS.ApplyShim)){var e=(null===(o=window.ShadyDOM)||void 0===o?void 0:o.inUse)&&!0===(null===(t=window.ShadyDOM)||void 0===t?void 0:t.noPatch)?window.ShadyDOM.wrap:function(i){return i},u=function(i){var n=v.get(i);return void 0===n&&v.set(i,n=[]),n},w=new Map,r=i.prototype.A;i.prototype.A=function(i){var n,o=r.call(this,i),t=null===(n=this.C)||void 0===n?void 0:n.scope;if(void 0!==t){window.ShadyCSS.nativeShadow||window.ShadyCSS.prepareTemplateDom(o,t);var d=u(t),v=o.content.querySelectorAll("style");d.push.apply(d,Array.from(v).map((function(i){var n;return null===(n=i.parentNode)||void 0===n||n.removeChild(i),i.textContent})))}return o};var f=document.createDocumentFragment(),l=document.createComment(""),s=n.prototype,a=s.M;s.M=function(i,n){var o,t,w;void 0===n&&(n=this);var r,s=e(this.D).parentNode,h=null===(o=this.options)||void 0===o?void 0:o.scope;if(s instanceof ShadowRoot&&void 0!==(r=h)&&!d.has(r)){var c=this.D,p=this.E;f.appendChild(l),this.D=l,this.E=null,a.call(this,i,n);var y=(null===(t=i)||void 0===t?void 0:t._$litType$)?this.L.G.B:document.createElement("template");if(function(i,n){var o=u(i);if(o.length){var t=document.createElement("style");t.textContent=o.join("\n"),n.content.appendChild(t)}d.add(i),v.delete(i),window.ShadyCSS.prepareTemplateStyles(n,i)}(h,y),f.removeChild(l),null===(w=window.ShadyCSS)||void 0===w?void 0:w.nativeShadow){var m=y.content.querySelector("style");null!==m&&f.appendChild(m.cloneNode(!0))}s.insertBefore(f,p),this.D=c,this.E=p}else a.call(this,i,n)},s.F=function(n,o){var t,d=null===(t=this.options)||void 0===t?void 0:t.scope,v=w.get(d);void 0===v&&w.set(d,v=new Map);var e=v.get(n);return void 0===e&&v.set(n,e=new i(o,this.options)),e}}}),globalThis.litHtmlPlatformSupport.noPatchSupported=!0,null!==(o=(t=globalThis).litElementPlatformSupport)&&void 0!==o||(t.litElementPlatformSupport=function(i){var n=i.LitElement;if(void 0!==window.ShadyCSS&&(!window.ShadyCSS.nativeShadow||window.ShadyCSS.ApplyShim)){n.N=!0;var o=n.prototype,t=o.createRenderRoot;o.createRenderRoot=function(){return this.I.scope=this.localName,t.call(this)}}})},"function"==typeof define&&define.amd?define(i):i()}));

