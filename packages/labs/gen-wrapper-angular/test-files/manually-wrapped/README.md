# manually-wraped test project

This project contains _manually written_ (not generated) Angular wrapper components, for the purposes of building and testing the wrapper semantics independently of th wrapper generator implementation.

## Wrapper creation steps

These are the steps used to create the wrapper. While the wrapper generator will probably just generate these files directly without using the Angular CLI, it's important for reproducability and understandability that we're able to execute these steps from a fresh project and end up with a working wrapper component.

These instructions create an Angular "library" project, which contains just the wrapper component and is independently publishable to npm. In order to preview and test the component we need an Angular workspace and an Angular app to actually render HTML into a browser. This might change with "standalone" components.

1. Install the Angular CLI:

   ```sh
   npm i -g @angular/cli
   ```

   From https://angular.io/guide/setup-local

1. Create an Angular workspace:

   ```sh
   ng new angular-workspace --no-create-application
   ```

   From https://angular.io/guide/creating-libraries#getting-started

1. Create a library project:

   ```sh
   cd angular-workspace
   ng generate library element-a
   ```

   This is the package that contains the actual wrapper component.

   From https://angular.io/guide/creating-libraries#getting-started

1. Create an application project:

   ```sh
   ng generate application test-app
   ```

   This application will allow us to actually view the component.

   This isn't well documented anywhere, but gleaned from this Twitter thread: https://twitter.com/justinfagnani/status/1506778260914335749

   At this point the `angular.json` file in the workspace should have two projects: `"element-a"` with `"projectType": "library"` and `"test-app"` with `"projectType": "application"`.

   You can verify the application is runnable:

   ```sh
   cd projects/test-app
   ng serve --open
   ```

1. Clear the application template

   This will let us concentrate on just our components.

   1. Open `gen-wrapper-angular/test-files/manually-wrapped/angular-workspace/projects/test-app/src/app/app.component.html`
   1. Replace the content with:
      ```html
      <h1>Angular Test App</h1>
      ```

   We'll keep the `<app-root>` component because it'll allow data-binding into our wrapper component.

1. Add the component to the application

   1. Build the component
      ```sh
      ng build element-a
      ```
   1. Open `gen-wrapper-angular/test-files/manually-wrapped/angular-workspace/projects/test-app/src/app/app.module.ts`

   1. Import the module:

      ```ts
      import {ElementAModule} from 'element-a';
      ```

   1. Add the component module to the app module:

      ```ts
      imports: [
        BrowserModule,
        ElementAModule
      ],
      ```

   1. Add the component tag to the app template:

      In `app.component.html`:

      ```html
      <h1>Angular Test App</h1>
      <lib-element-a></lib-element-a>
      ```

   1. Preview the app:

      If you left the browser tab open with the app, it should automatically update to show the message "element-a works!".

1. Update the component to wrap our web component

   1. Change the wrapper component selector to `element-a`
   1. Change app component HTML to use `<element-a>`
   1. Change the wrapper component template to `<ng-content><ng-content>`
   1. Add a dependency on `@lit-test/manually-wrapped`
   1. Import `@lit-test/manually-wrapped` into the component
   1. Add `"allowedNonPeerDependencies": ["@lit-test/manually-wrapped"],` to `ng-package.json`
   1. Add `angular-workspace/projects/*` to `lerna.json`
   1. Run `lerna bootstrap`
   1. Run `ng serve --open` again and you should see the Lit element output.

1. Wrap properties

   1. Get a reference to the element and Zone via DI. Add a constrtuctor:

      ```ts
      private _el: ElementA;
      private _ngZone: NgZone;

      constructor(e: ElementRef, ngZone: NgZone) {
        this._el = e.nativeElement;
        this._ngZone = ngZone;
      }
      ```

   1. Add an `@Input` for the `foo` property in our web component:

      ```ts
      @Input()
      set foo(v: number) {
        this._ngZone.runOutsideAngular(() => (this._el.foo = v));
      }

      get foo() {
        return this._el.foo;
      }
      ```

   1. Test the input with a binding from the app component. Add to `app.component.html`:
      ```html
      <element-a [foo]="21"></element-a>
      ```
   1. Test that a built-in HTML property works too:
      1. Add an id binging in `app.component.html`:
         ```html
         <element-a [foo]="21" id="the-thing"></element-a>
         ```
      1. Use the id in the web component:
         ```ts
         html`
         <p></code><code>this.id: ${this.id}</code></p>
         `;
         ```
   1. Add an event to the web component...
   1. Wrap the event in an `@Output()`/`EventEmitter`:
      1. Add an `@Output`:
         ```ts
         @Output()
         fooEvent = new EventEmitter<number>();
         ```
      1. Wire the event to the output:
         ```ts
         constructor(e: ElementRef, ngZone: NgZone) {
         // ...
         this._el.addEventListener('foo', (e: FooEvent) => {
             this.fooEvent.emit(e.value);
         });
         }
         ```
   1. Use the event in the app component...
