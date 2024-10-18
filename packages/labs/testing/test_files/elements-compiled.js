/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
export class MyElement extends LitElement {
    render() {
        return html` <slot></slot> `;
    }
    constructor(...args){
        super(...args), _define_property(this, "name", 'World');
    }
}
_define_property(MyElement, "styles", css`
    :host {
      display: block;
    }
  `);
_ts_decorate([
    property()
], MyElement.prototype, "name", void 0);
MyElement = _ts_decorate([
    customElement('my-element')
], MyElement);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjxhbm9uPiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAyMiBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cblxuaW1wb3J0IHtMaXRFbGVtZW50LCBodG1sLCBjc3N9IGZyb20gJ2xpdCc7XG5pbXBvcnQge2N1c3RvbUVsZW1lbnQsIHByb3BlcnR5fSBmcm9tICdsaXQvZGVjb3JhdG9ycy5qcyc7XG5cbkBjdXN0b21FbGVtZW50KCdteS1lbGVtZW50JylcbmV4cG9ydCBjbGFzcyBNeUVsZW1lbnQgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgc3RhdGljIG92ZXJyaWRlIHN0eWxlcyA9IGNzc2BcbiAgICA6aG9zdCB7XG4gICAgICBkaXNwbGF5OiBibG9jaztcbiAgICB9XG4gIGA7XG5cbiAgQHByb3BlcnR5KClcbiAgbmFtZSA9ICdXb3JsZCc7XG5cbiAgb3ZlcnJpZGUgcmVuZGVyKCkge1xuICAgIHJldHVybiBodG1sYCA8c2xvdD48L3Nsb3Q+IGA7XG4gIH1cbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgSFRNTEVsZW1lbnRUYWdOYW1lTWFwIHtcbiAgICAnbXktZWxlbWVudCc6IE15RWxlbWVudDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIkxpdEVsZW1lbnQiLCJodG1sIiwiY3NzIiwiY3VzdG9tRWxlbWVudCIsInByb3BlcnR5IiwiTXlFbGVtZW50IiwicmVuZGVyIiwibmFtZSIsInN0eWxlcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Q0FJQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELFNBQVFBLFVBQVUsRUFBRUMsSUFBSSxFQUFFQyxHQUFHLFFBQU8sTUFBTTtBQUMxQyxTQUFRQyxhQUFhLEVBQUVDLFFBQVEsUUFBTyxvQkFBb0I7QUFHMUQsT0FBTyxNQUFNQyxrQkFBa0JMO0lBVXBCTSxTQUFTO1FBQ2hCLE9BQU9MLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDOUI7O3dCQUxBLHVCQUNBTSxRQUFPOztBQUtUO0FBWkUsaUJBRFdGLFdBQ0tHLFVBQVNOLEdBQUcsQ0FBQzs7OztFQUk3QixDQUFDIn0=