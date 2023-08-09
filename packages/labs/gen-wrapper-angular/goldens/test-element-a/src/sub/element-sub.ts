import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';

import type {ElementSub as ElementSubElement} from '@lit-internal/test-element-a/sub/element-sub.js';
import '@lit-internal/test-element-a/sub/element-sub.js';

@Component({
  selector: 'element-sub',
  template: '<ng-content></ng-content>',
})
export class ElementSub {
  private _el: ElementSubElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('sub-changed', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.subChangedEvent.emit(e);
    });
  }

  @Input()
  set foo(v: string | undefined) {
    this._ngZone.runOutsideAngular(() => (this._el.foo = v));
  }

  get foo() {
    return this._el.foo;
  }

  @Output()
  subChangedEvent = new EventEmitter<unknown>();
}
