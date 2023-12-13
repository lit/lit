import {Component, ElementRef, NgZone} from '@angular/core';

import type {ElementMixins as ElementMixinsElement} from '@lit-internal/test-element-a/element-mixins.js';
import '@lit-internal/test-element-a/element-mixins.js';

@Component({
  selector: 'element-mixins',
  template: '<ng-content></ng-content>',
})
export class ElementMixins {
  constructor(_e: ElementRef<ElementMixinsElement>, _ngZone: NgZone) {}
}
