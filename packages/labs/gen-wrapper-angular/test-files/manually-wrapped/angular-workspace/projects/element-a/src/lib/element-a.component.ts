import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-element-a',
  template: `
    <p>
      element-a works!
    </p>
  `,
  styles: [
  ]
})
export class ElementAComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
