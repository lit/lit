import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output,
} from '@angular/core';
import type {ElementA, FooEvent} from '@lit-test/manually-wrapped';
import '@lit-test/manually-wrapped';

@Component({
  selector: 'element-a',
  template: `<ng-content></ng-content>`,
})
export class ElementAComponent implements OnInit {
  private _el: ElementA;
  private _ngZone: NgZone;

  constructor(e: ElementRef, ngZone: NgZone) {
    this._el = e.nativeElement;
    this._ngZone = ngZone;
    this._el.addEventListener('foo', (e: FooEvent) => {
      this.fooEvent.emit(e.value);
    });
  }

  ngOnInit(): void {
    console.log('ElementAComponent onInit');
  }

  @Input()
  set foo(v: number) {
    this._ngZone.runOutsideAngular(() => (this._el.foo = v));
  }

  get foo() {
    return this._el.foo;
  }

  @Output()
  fooEvent = new EventEmitter<number>();
}
