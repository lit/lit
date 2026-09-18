import {
  Component,
  ElementRef,
  NgZone,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  CellSlotsChangeEvent,
  CellIconSlotsChangeEvent,
} from '@lit-internal/test-element-a/element-slots.js';
export type {
  CellSlotsChangeEvent,
  CellIconSlotsChangeEvent,
} from '@lit-internal/test-element-a/element-slots.js';
import type {ElementSlots as ElementSlotsElement} from '@lit-internal/test-element-a/element-slots.js';
import '@lit-internal/test-element-a/element-slots.js';

@Component({
  selector: 'element-slots',
  template: '<ng-content></ng-content>',
  standalone: true,
  imports: [],
})
export class ElementSlots {
  private _el: ElementSlotsElement;
  private _ngZone: NgZone;

  constructor(e: ElementRef<ElementSlotsElement>, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;

    this._el.addEventListener('cell-slots-change', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.cellSlotsChangeEvent.emit(e as CellSlotsChangeEvent);
    });

    this._el.addEventListener('cell-icon-slots-change', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.cellIconSlotsChangeEvent.emit(e as CellIconSlotsChangeEvent);
    });

    this._el.addEventListener('tab-icon-slots-change', (e: Event) => {
      // TODO(justinfagnani): we need to let the element say how to get a value
      // from an event, ex: e.value
      this.tabIconSlotsChangeEvent.emit(e);
    });
  }

  @Input()
  set mainDefault(v: string) {
    this._ngZone.runOutsideAngular(() => (this._el.mainDefault = v));
  }

  get mainDefault() {
    return this._el.mainDefault;
  }

  @Input()
  set tabs(v: {id: string; title: string}[]) {
    this._ngZone.runOutsideAngular(() => (this._el.tabs = v));
  }

  get tabs() {
    return this._el.tabs;
  }

  @Output()
  cellSlotsChangeEvent = new EventEmitter<CellSlotsChangeEvent>();

  @Output()
  cellIconSlotsChangeEvent = new EventEmitter<CellIconSlotsChangeEvent>();

  @Output()
  tabIconSlotsChangeEvent = new EventEmitter<unknown>();
}
