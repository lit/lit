import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';

import type {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-a/element-events.js';
import '@lit-internal/test-element-a/element-events.js';

@Component({
  selector: 'element-events',
  template: '<ng-content></ng-content>',
})
export class ElementEvents {
  private _el: ElementEventsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('string-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.stringCustomEventEvent.emit(e);
    });

    this._el.addEventListener('number-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.numberCustomEventEvent.emit(e);
    });

    this._el.addEventListener('my-detail-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.myDetailCustomEventEvent.emit(e);
    });

    this._el.addEventListener('event-subclass', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.eventSubclassEvent.emit(e);
    });

    this._el.addEventListener('special-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.specialEventEvent.emit(e);
    });

    this._el.addEventListener('template-result-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.templateResultCustomEventEvent.emit(e);
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
  stringCustomEventEvent = new EventEmitter<unknown>();

  @Output()
  numberCustomEventEvent = new EventEmitter<unknown>();

  @Output()
  myDetailCustomEventEvent = new EventEmitter<unknown>();

  @Output()
  eventSubclassEvent = new EventEmitter<unknown>();

  @Output()
  specialEventEvent = new EventEmitter<unknown>();

  @Output()
  templateResultCustomEventEvent = new EventEmitter<unknown>();
}
