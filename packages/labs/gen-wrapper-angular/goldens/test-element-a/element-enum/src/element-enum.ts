import {Component, ElementRef, NgZone, Input} from '@angular/core';
import {Size} from '@lit-internal/test-element-a/element-enum.js';
export {Size} from '@lit-internal/test-element-a/element-enum.js';
import type {ElementEnum as ElementEnumElement} from '@lit-internal/test-element-a/element-enum.js';
import '@lit-internal/test-element-a/element-enum.js';

@Component({
  selector: 'element-enum',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementEnum {
  private _el: ElementEnumElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef<ElementEnumElement>, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;
  }

  @Input()
  set size(v: Size) {
    this._ngZone.runOutsideAngular(() => (this._el.size = v));
  }

  get size() {
    return this._el.size;
  }
}
