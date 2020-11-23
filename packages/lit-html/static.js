import{html as t,svg as o}from"./lit-html.js";
/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const i=t=>({ct:t}),l=new Map,r=t=>(o,...i)=>{var r;const s=i.length;let n,v;const $=[],a=[];let c,e=0,d=!1;for(;e<s;){for(c=o[e];e<s&&void 0!==(v=i[e],n=null===(r=v)||void 0===r?void 0:r.ct);)c+=n+o[++e],d=!0;a.push(v),$.push(c),e++}if(e===s&&$.push(o[s]),d){const t=$.join("$$lit$$");void 0===(o=l.get(t))&&l.set(t,o=$),i=a}return t(o,...i)},s=r(t),n=r(o);export{s as html,n as svg,i as unsafeStatic,r as withStatic};
//# sourceMappingURL=static.js.map
