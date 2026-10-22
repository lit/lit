import {html} from 'lit';

// Expressions inside template or textarea not ok in DEV_MODE:
html`<template>${'test'}</template>`;
html`<div><template>${'test'}</template></div>`;
html`<template>
  <div>
    <div>
      <div><div>${'test'}</div></div>
    </div>
  </div>
</template>`;
html`<template>
  <div>
    <div>
      <div><div class="${'test'}"></div></div>
    </div>
  </div>
</template>`;
html`<template>
  <div>
    <div>
      <div><div ${'test'}></div></div>
    </div>
  </div>
</template>`;
html`<textarea>${'test'}</textarea>`;
html`<div><textarea>${'test'}</textarea></div>`;
html`<textarea>
  <div>
    <div>
      <div><div>${'test'}</div></div>
    </div>
  </div>
</textarea>`;
html`<textarea>
  <div>
    <div>
      <div><div class="${'test'}"></div></div>
    </div>
  </div>
</textarea>`;
html`<textarea>
  <div>
    <div>
      <div><div ${'test'}></div></div>
    </div>
  </div>
</textarea>`;

// Valid, because attribute on outer template element is ok:
html`<template id=${'test'}
  ><template>
    <div>Valid. Static content can be compiled.</div>
  </template></template
>`;
html`<textarea id=${'test'}>Valid, can be compiled.</textarea>`;
