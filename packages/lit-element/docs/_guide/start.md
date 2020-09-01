---
layout: guide
title: Getting Started
slug: start
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

There are two main ways to use LitElement: 


*   **Creating reusable components to share with other developers.** Individual components or sets of related components are usually published to npm. To create a reusable component project, see [Create a LitElement component project](#component-project).

*   **Creating app-specific components.** The source for these components may live as part of an application project. To add LitElement components to your app, see [Add LitElement to an existing project](#existing-project).

## Create a LitElement component project {#component-project}

Get started writing a reusable LitElement component that could be published for others to use. 

To get started working on a component locally, you can use one of these starter projects:

*   [LitElement JavaScript starter project ](https://github.com/PolymerLabs/lit-element-starter-js)
*   [LitElement TypeScript starter project](https://github.com/PolymerLabs/lit-element-starter-ts)

Both projects define a LitElement component. They also add a set of optional tools for developing, linting, and testing the component:

*   Node.js and npm for managing dependencies. _Requires Node.js 10 or greater._
*   A local dev server,  [ES dev server](https://open-wc.org/developing/es-dev-server.html#getting-started).
*   Linting with [ESLint](https://eslint.org/) and [lit-analyzer](https://www.npmjs.com/package/lit-analyzer).
*   Testing with [Karma](https://karma-runner.github.io/latest/index.html).
*   A static doc site built with [web component analyzer](https://www.npmjs.com/package/web-component-analyzer) and [eleventy](https://www.11ty.dev/).

None of these tools is _required_ to work with LitElement. They represent one possible set of tools for a good developer experience. 

<div class="alert alert-info">

**Alternative starting point.** As an alternative to the official LitElement starter projects, the open-wc project has a [project generator](https://open-wc.org/init/) for both web components using LitElement. The open-wc script asks a series of questions and scaffolds out a project for you. 

</div>

### Download the starter project

The quickest way to try out a project locally is to download one of the starter projects as a zip file. 

1.  Download the starter project from GitHub as a zip file:

    *   [JavaScript starter project](https://github.com/PolymerLabs/lit-element-starter-js/archive/master.zip)
    *   [TypeScript starter project](https://github.com/PolymerLabs/lit-element-starter-ts/archive/master.zip)

1.  Uncompress the zip file.

1.  Install dependencies.

    ```bash
    cd <project folder>
    npm i
    ```

<div class="alert alert-info">

**Want it on GitHub?** If you're familiar with git you may want to create a GitHub repository for your starter project,
instead of just downloading the zip file. You can use the [GitHub template repository](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template) feature to create your own repository from the [JavaScript starter project ](https://github.com/PolymerLabs/lit-element-starter-js) or the [TypeScript starter project](https://github.com/PolymerLabs/lit-element-starter-ts). Then clone your new repository and install dependencies, as above.

</div>

### Try out your project

1.  **If you're using the TypeScript version of the starter**, build the JavaScript version of your project:

    ```bash
    npm run build
    ```

    To watch files and rebuild when the files are modified, run the following command in a separate shell:

    ```bash
    npm run build:watch
    ```

    **No build step is required if you're using the JavaScript version of the starter project.**

1.  Run the dev server:

    ```bash
    npm run serve
    ```

1.  Open the project demo page in a browser tab. For example:

    [http://localhost:8000/dev/](http://localhost:8000/dev/)

    Your server may use a different port number. Check the URL in the terminal output for the correct port number.


### Edit your component

Edit your component definition. The file you edit depends on which language you're using:

*   JavaScript. Edit the `my-element.js` file in the project root.
*   TypeScript. Edit the `my-element.ts` file in the `src` directory.

A couple of things to look for in the code:

*   The code defines a class for the component (`MyElement`) and registers it with the browser as a custom element named `<my-element>`.

    _JavaScript_

    ```js
    export class MyElement extends LitElement { ... } 

    customElements.define('my-element', MyElement);
    ``` 

    _TypeScript_

    ```ts
    @customElement('my-element')
    export class MyElement extends LitElement { ... } 
    ```


*   The component's `render` method defines a [template](templates) that will be rendered as a part of the component. In this case, it includes some text, some data bindings, and a button. For more information, see [Templates](templates).

    ```js
    export class MyElement extends LitElement {
      ...
      render() {
        return html`
          <h1>Hello, ${this.name}!</h1>
          <button @click=${this._onClick}>
            Click Count: ${this.count}
          </button>
          <slot></slot>
        `;
      }
    }
    ```

*   The component defines some [properties](properties). The component responds to changes in these properties (for example, by re-rendering the template when necessary). For more information, see [Properties](properties). 

    _JavaScript_

    ```js
    export class MyElement extends LitElement {

      static get properties() {
        return {
          name: {type: String}
        }
      }

      constructor() {
        super();
        this.name = 'World';
      }
      ...
    }
    ```

    _TypeScript_

    ```ts
    export class MyElement extends LitElement {
      ...
      @property({type: String})
      name = 'World';
      ...
    }
    ```

### Rename your component

You'll probably want to change the component name from "my-element" to something more appropriate. This is easiest to do using an IDE or other text editor that lets you do a global search and replace through an entire project.

1.  If you're using the TypeScript version, remove generated files:

    ```bash
    npm run clean
    ```

1.  Search and replace "my-element" with your new component name in all files in your project (except in the `node_modules` folder).
1.  Search and replace "MyElement" with your new class name in all files in your project (except in the `node_modules` folder).
1.  Rename the source and test files to match the new component name:

    JavaScript:

    * `src/my-element.js`
    * `src/test/my-element_test.js`

    TypeScript:

    * `src/my-element.ts`
    * `src/test/my-element_test.ts`

1.  Test and make sure your component is still working:

    ```bash
    npm run build
    npm run serve
    ```

### Next steps

Ready to add features to your new component? Head over to [Templates](templates) for details on writing templates for your LitElement component.

For details on running tests and using other tools, see the starter project README:

*   [TypeScript project README](https://github.com/PolymerLabs/lit-element-starter-ts/blob/master/README.md)
*   [JavaScript project README](https://github.com/PolymerLabs/lit-element-starter-js/blob/master/README.md)

## Add LitElement to an existing project {#existing-project}

You don't need a lot of tooling for LitElement projects. Chances are if you have an existing set of tools, you can integrate LitElement into it with very limited changes. These instructions assume you're using npm for package management, and using a tool like Rollup or webpack to bundle your code for production.

For details on building projects, including some sample Rollup configurations, see [Build for production](build).

<div class="alert alert-info">

**If you're starting from scratch**, the open-wc project has a [project generator](https://open-wc.org/init/) that can scaffold out an application project using LitElement.

</div>

### Prerequisites

Your build system will need to handle consuming bare module specifiers:

```js
import {LitElement, html} from 'lit-element';
```

Webpack automatically handles bare module specifiers; for Rollup, you'll need a plugin ([@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)).

### Install LitElement

LitElement is available from npm:

```bash
npm i lit-element 
```

### Add an element

Pick a location to store your LitElement components, and create a test element: 

_components/my-element.js_

```js
import {LitElement, html} from 'lit-element';

class MyElement extends LitElement {
  render() {
    return html`
      <div>Hello from MyElement!</div>
    `;
  }
}

customElements.define('my-element', MyElement);
```

Import your component:

Index.js

```js
import './components/my-elements.js';
```

Use your component:

index.html

```html
<my-element></my-element>
```

At this point, you should be able to build and run your project and see the "Hello from MyElement!" message.

### Adjust for your build system

How you import the component may vary slightly depending on your build system and project structure. If you're writing in TypeScript, you'll use TypeScript files and use LitElement's decorators. (You can find a sample TypeScript element in the [TypeScript starter project](https://github.com/PolymerLabs/lit-element-starter-ts/blob/master/src/my-element.ts)).

For more details and sample build configurations, see [Build for production](build).

### Optional: Use ES dev server

If you already have a dev server that works with your build system, it should work with LitElement. [ES dev server](https://open-wc.org/developing/es-dev-server.html) is an alternative dev server that provides a simple, bundler-free workflow. It performs a small number of useful transforms, including transforming bare module specifiers, transpiling to ES5 when needed, and adding polyfills for older browsers.

1. Install es-dev-server

    ```bash
    npm i -D es-dev-server
    ```

1. Add a dev server command to `package.json`: 


    ```json
    {
      "scripts": {
        "serve": "es-dev-server --app-index index.html --node-resolve --watch --open"
      }
    }
    ```

1. Start ES dev server:

    ```bash
    npm run serve
    ```

### Supporting older browsers

To support older browsers that don't support ES6 and the web components specifications, you'll need to take a few extra steps to produce code that will run on the older browsers. 

See [Build for production](build) fpr more information.

### Next steps

Ready to add features to your project? Head over to [Templates](templates) for details on writing templates for your LitElement component.

For more on building applications that use web components, see the open-wc recommendations on [Building](https://open-wc.org/building/).

