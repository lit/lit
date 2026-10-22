import {Component, ElementRef, NgZone} from '@angular/core';

import type {ElementWithoutProps as ElementWithoutPropsElement} from '@lit-internal/test-element-a/element-without-props.js';
import '@lit-internal/test-element-a/element-without-props.js';

@Component({
  selector: 'element-without-props',
  template: '<ng-content></ng-content>',
})
export class ElementWithoutProps {
  constructor(_e: ElementRef<ElementWithoutPropsElement>, _ngZone: NgZone) {}
}
