import { Component, OnInit } from '@angular/core';
import '@lit-test/manually-wrapped';

@Component({
  selector: 'element-a',
  template: `<ng-content></ng-content>`,
  styles: [
  ]
})
export class ElementAComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('ElementAComponent onInit');
  }

}
