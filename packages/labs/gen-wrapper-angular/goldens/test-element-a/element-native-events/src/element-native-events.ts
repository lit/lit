import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';
export type {NativeDetail} from '@lit-internal/test-element-a/element-native-events.js';
import type {ElementNativeEvents as ElementNativeEventsElement} from '@lit-internal/test-element-a/element-native-events.js';
import '@lit-internal/test-element-a/element-native-events.js';

@Component({
  selector: 'element-native-events',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementNativeEvents {
  private _el: ElementNativeEventsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef<ElementNativeEventsElement>, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('input', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.inputEvent.emit(e as CustomEvent<NativeDetail>);
    });

    this._el.addEventListener('value-changed', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.valueChangedEvent.emit(e as CustomEvent<NativeDetail>);
    });
  }

  @Input()
  set value(v: number) {
    this._ngZone.runOutsideAngular(() => (this._el.value = v));
  }

  get value() {
    return this._el.value;
  }

  @Output()
  inputEvent = new EventEmitter<CustomEvent<NativeDetail>>();

  @Output()
  valueChangedEvent = new EventEmitter<CustomEvent<NativeDetail>>();
}
