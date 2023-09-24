import {Component, ElementRef, NgZone} from '@angular/core';

import type {ElementMixins as ElementMixinsElement} from '@lit-internal/test-element-a/element-mixins.js';
import '@lit-internal/test-element-a/element-mixins.js';

@Component({
  selector: 'element-mixins',
  template: '<ng-content></ng-content>',
})
export class ElementMixins {
  private _el: ElementMixinsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;
  }
}
