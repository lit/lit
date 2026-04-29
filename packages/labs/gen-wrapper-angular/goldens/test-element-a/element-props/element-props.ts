import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';

import type {
  ElementProps as ElementPropsElement,
  MyType,
  AttributeVariant,
} from '@lit-internal/test-element-a/element-props.js';
import '@lit-internal/test-element-a/element-props.js';

@Component({
  selector: 'element-props',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementProps {
  private _el: ElementPropsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef<ElementPropsElement>, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('a-changed', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.aChangedEvent.emit(e);
    });
  }

  @Input()
  set aStr(v: string) {
    this._ngZone.runOutsideAngular(() => (this._el.aStr = v));
  }

  get aStr() {
    return this._el.aStr;
  }

  @Input()
  set aNum(v: number) {
    this._ngZone.runOutsideAngular(() => (this._el.aNum = v));
  }

  get aNum() {
    return this._el.aNum;
  }

  @Input()
  set aBool(v: boolean) {
    this._ngZone.runOutsideAngular(() => (this._el.aBool = v));
  }

  get aBool() {
    return this._el.aBool;
  }

  @Input()
  set aStrArray(v: string[]) {
    this._ngZone.runOutsideAngular(() => (this._el.aStrArray = v));
  }

  get aStrArray() {
    return this._el.aStrArray;
  }

  @Input()
  set aMyType(v: MyType) {
    this._ngZone.runOutsideAngular(() => (this._el.aMyType = v));
  }

  get aMyType() {
    return this._el.aMyType;
  }

  @Input()
  set variant(v: AttributeVariant) {
    this._ngZone.runOutsideAngular(() => (this._el.variant = v));
  }

  get variant() {
    return this._el.variant;
  }

  @Output()
  aChangedEvent = new EventEmitter<unknown>();
}
