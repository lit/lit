import { html } from 'lit-html';
import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1._$LH;
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<h1>One</h1>`, parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
const lit_template_2 = { h: b_1 `<h1>Two</h1>`, parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: _$LH_AttributePart }] };
function templates() {
    const one = { ["_$litType$"]: lit_template_1, values: ['class-binding'] };
    const two = { ["_$litType$"]: lit_template_2, values: ['second-class-binding'] };
}
