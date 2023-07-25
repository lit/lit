import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1._$LH;
import { html } from 'lit-html';
const lit_template_1 = { h: (i => i) `<h1>One</h1>`, parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
const lit_template_2 = { h: (i => i) `<h1>Two</h1>`, parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
function templates() {
    const one = { _$litType$: lit_template_1, values: ['class-binding'] };
    const two = { _$litType$: lit_template_2, values: ['second-class-binding'] };
}
