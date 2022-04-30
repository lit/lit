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
        import { ElementAModule } from 'element-a';
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
