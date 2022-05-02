import {Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'test-app';

  foo = 0;

  setFoo(value: number) {
    this.foo = value;
  }
}
