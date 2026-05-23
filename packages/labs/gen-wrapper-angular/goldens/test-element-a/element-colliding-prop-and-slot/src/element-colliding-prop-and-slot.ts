import {Component, ElementRef, NgZone, Input} from '@angular/core';

import type {ElementCollidingPropAndSlot as ElementCollidingPropAndSlotElement} from '@lit-internal/test-element-a/element-colliding-prop-and-slot.js';
import '@lit-internal/test-element-a/element-colliding-prop-and-slot.js';

@Component({
  selector: 'element-colliding-prop-and-slot',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementCollidingPropAndSlot {
  private _el: ElementCollidingPropAndSlotElement;
  private _ngZone: NgZone;

  constructor(
    e: ElementRef<ElementCollidingPropAndSlotElement>,
    ngZone: NgZone
  ) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;
  }

  @Input()
  set content(v: string) {
    this._ngZone.runOutsideAngular(() => (this._el.content = v));
  }

  get content() {
    return this._el.content;
  }
}
