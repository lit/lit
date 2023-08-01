import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import * as litHtmlPrivate_1 from "lit-html/private-ssr-support.js";
const { AttributePart: A_1, PropertyPart: P_1, BooleanAttributePart: B_1, EventPart: E_1 } = litHtmlPrivate_1._$LH;
const b_1 = i => i;
const lit_template_1 = { h: b_1 ` <div>\n  <?>\n</div>`, parts: [{ type: 1, index: 0, name: "attribute-part", strings: ["", ""], ctor: A_1 }, { type: 1, index: 0, name: "boolean-attribute-part", strings: ["", ""], ctor: B_1 }, { type: 1, index: 0, name: "propertyPart", strings: ["", ""], ctor: P_1 }, { type: 1, index: 0, name: "click", strings: ["", ""], ctor: E_1 }, { type: 6, index: 0 }, { type: 2, index: 1 }] };
({ ["_$litType$"]: lit_template_1, values: ['attributeValue', true, 'propertyValue', () => console.log('EventPart'), ref(console.log), 'childPart'] });
