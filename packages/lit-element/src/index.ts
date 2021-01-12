export * from '@lit/reactive-element';
export * from 'lit-html';
export * from './lit-element.js';
export {_$private} from './lit-element.js';

// TODO: link to docs on the new site
console.warn(
  "The main 'lit-element' package is deprecated. " +
    "Please import from the 'lit' package: 'lit' and 'lit/decorators.ts' " +
    "or import from 'lit-element/lit-element.ts'."
);
