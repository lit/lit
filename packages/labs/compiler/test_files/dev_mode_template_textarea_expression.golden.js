import { html } from 'lit';
// Expressions inside template or textarea not ok in DEV_MODE:
html `<template>${'test'}</template>`;
html `<div><template>${'test'}</template></div>`;
html `<template>
  <div>
    <div>
      <div><div>${'test'}</div></div>
    </div>
  </div>
</template>`;
html `<template>
  <div>
    <div>
      <div><div class="${'test'}"></div></div>
    </div>
  </div>
</template>`;
html `<template>
  <div>
    <div>
      <div><div ${'test'}></div></div>
    </div>
  </div>
</template>`;
html `<textarea>${'test'}</textarea>`;
html `<div><textarea>${'test'}</textarea></div>`;
html `<textarea>
  <div>
    <div>
      <div><div>${'test'}</div></div>
    </div>
  </div>
</textarea>`;
html `<textarea>
  <div>
    <div>
      <div><div class="${'test'}"></div></div>
    </div>
  </div>
</textarea>`;
html `<textarea>
  <div>
    <div>
      <div><div ${'test'}></div></div>
    </div>
  </div>
</textarea>`;
import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: A_1 } = litHtmlPrivate_1._$LH;
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<template><template>\n    <div>Valid. Static content can be compiled.</div>\n  </template></template>`, parts: [{ type: 1, index: 0, name: "id", strings: ["", ""], ctor: A_1 }] };
// Valid, because attribute on outer template element is ok:
({ ["_$litType$"]: lit_template_1, values: ['test'] });
const lit_template_2 = { h: b_1 `<textarea>Valid, can be compiled.</textarea>`, parts: [{ type: 1, index: 0, name: "id", strings: ["", ""], ctor: A_1 }] };
({ ["_$litType$"]: lit_template_2, values: ['test'] });
