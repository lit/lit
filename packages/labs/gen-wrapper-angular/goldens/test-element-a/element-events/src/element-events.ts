import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
import {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
import {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
import {TemplateResult} from 'lit';
export type {MyDetail} from '@lit-internal/test-element-a/detail-type.js';
export type {EventSubclass} from '@lit-internal/test-element-a/element-events.js';
export type {SpecialEvent} from '@lit-internal/test-element-a/special-event.js';
export type {TemplateResult} from 'lit';
import type {ElementEvents as ElementEventsElement} from '@lit-internal/test-element-a/element-events.js';
import '@lit-internal/test-element-a/element-events.js';

@Component({
  selector: 'element-events',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementEvents {
  private _el: ElementEventsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef<ElementEventsElement>, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('string-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.stringCustomEventEvent.emit(e as CustomEvent<string>);
    });

    this._el.addEventListener('number-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.numberCustomEventEvent.emit(e as CustomEvent<number>);
    });

    this._el.addEventListener('my-detail-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.myDetailCustomEventEvent.emit(e as CustomEvent<MyDetail>);
    });

    this._el.addEventListener('event-subclass', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.eventSubclassEvent.emit(e as EventSubclass);
    });

    this._el.addEventListener('special-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.specialEventEvent.emit(e as SpecialEvent);
    });

    this._el.addEventListener('template-result-custom-event', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.templateResultCustomEventEvent.emit(
        e as CustomEvent<TemplateResult>
      );
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
  stringCustomEventEvent = new EventEmitter<CustomEvent<string>>();

  @Output()
  numberCustomEventEvent = new EventEmitter<CustomEvent<number>>();

  @Output()
  myDetailCustomEventEvent = new EventEmitter<CustomEvent<MyDetail>>();

  @Output()
  eventSubclassEvent = new EventEmitter<EventSubclass>();

  @Output()
  specialEventEvent = new EventEmitter<SpecialEvent>();

  @Output()
  templateResultCustomEventEvent = new EventEmitter<
    CustomEvent<TemplateResult>
  >();
}
