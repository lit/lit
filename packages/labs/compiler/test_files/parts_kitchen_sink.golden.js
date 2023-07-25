import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: _$LH_AttributePart, PropertyPart: _$LH_PropertyPart, BooleanAttributePart: _$LH_BooleanAttributePart, EventPart: _$LH_EventPart } = litHtmlPrivate_1._$LH;
import { html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
// Example of ElementPart
const divRef = createRef();
const b_1 = i => i;
const lit_template_1 = { h: b_1 ` <div>\n  <?>\n</div>`, parts: [{ type: 1, index: 0, name: "attribute-part", strings: ["", ""], ctor: _$LH_AttributePart }, { type: 1, index: 0, name: "boolean-attribute-part", strings: ["", ""], ctor: _$LH_BooleanAttributePart }, { type: 1, index: 0, name: "propertyPart", strings: ["", ""], ctor: _$LH_PropertyPart }, { type: 1, index: 0, name: "click", strings: ["", ""], ctor: _$LH_EventPart }, { type: 6, index: 0 }, { type: 2, index: 1 }] };
({ ["_$litType$"]: lit_template_1, values: ['attributeValue', true, 'propertyValue', () => console.log('EventPart'), ref(divRef), 'childPart'] });
