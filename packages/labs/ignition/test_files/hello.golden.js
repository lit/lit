import { html } from 'lit';
export const simple = () => html `<div __ignition-source-id__="0">Hello, world!</div>`;
export const customElement = () => html `<x-foo __ignition-source-id__="1">Hello, world!</x-foo>`;
export const withAttribute = () => html `<div __ignition-source-id__="2" class="a">Hello, world!</div>`;
export const withUnquotedAttribute = () => html `<div __ignition-source-id__="3" hidden>Hello, world!</div>`;
export const withChildren = () => html `<div __ignition-source-id__="4" class="a"><span __ignition-source-id__="5">A</span></div>`;
export const nested = () => html `\n  <div __ignition-source-id__="6" class="a">\n    ${html `<span __ignition-source-id__="9">A</span>`}\n    <span __ignition-source-id__="7"></span>\n  </div>\n  <div __ignition-source-id__="8" class="b"></div>\n`;
