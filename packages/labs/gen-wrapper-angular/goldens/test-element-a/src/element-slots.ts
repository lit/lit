import {Component, ElementRef, NgZone, Input} from '@angular/core';

import type {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-a/element-slots.js';
import '@lit-internal/test-element-a/element-slots.js';

@Component({
  selector: 'element-slots',
  template: '<ng-content></ng-content>',
})
export class ElementSlots {
  private _el: ElementSlotsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;
  }

  @Input()
  set mainDefault(v: string) {
    this._ngZone.runOutsideAngular(() => (this._el.mainDefault = v));
  }

  get mainDefault() {
    return this._el.mainDefault;
  }
}
