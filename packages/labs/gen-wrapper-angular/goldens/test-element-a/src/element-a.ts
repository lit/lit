import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';

import type {ElementA as ElementAElement} from '@lit-internal/test-element-a/element-a.js';
import '@lit-internal/test-element-a/element-a.js';

@Component({
  selector: 'element-a',
  template: '<ng-content></ng-content>',
})
export class ElementA {
  private _el: ElementAElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('a-changed', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.aChangedEvent.emit(e);
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
  aChangedEvent = new EventEmitter<unknown>();
}
