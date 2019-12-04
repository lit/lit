# LitElement TypeScript starter 

This directory includes a sample component project using LitElement with TypeScript

This sample uses the TypeScript compiler (tsc) to produce JavaScript that runs in modern browsers.

This sample uses [ES dev server](https://github.com/open-wc/open-wc/tree/master/packages/es-dev-server) 
for previewing the project without a build step. ES dev server handles resolving Node-style 
import specifiers, which aren't supported in browsers. It also automatically transpiles code 
and adds polyfills to support older browsers.

## Setup

Install dependencies:

```bash
npm -i
```

## Build

To build JavaScript version of your component:

```bash
npm run build
```

To watch files and rebuild when the files are modified,
run the following command in a separate window:

```bash
npm run build:watch
```


## Preview

Run the dev server and open the project in a new browser tab:

```bash
npm start
```

## More information

See [Get started](https://lit-element.polymer-project.org/guide/start) on the LitElement site for
more information.

