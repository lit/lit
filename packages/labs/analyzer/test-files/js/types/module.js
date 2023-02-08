/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/** @typedef {import("./external.js").ImportedInterface} ImportedInterface */
import {ImportedClass, returnsClass} from './external.js';
import {LitElement, html} from 'lit';

/** @type {string} */
export const testString = 'hi';
export const inferredString = 'hi';

export class LocalClass {}

/**
 * @typedef LocalInterface
 * @prop {number} someData
 */

/** @type {LocalClass} */
export let localClass;
/** @type {ImportedClass} */
export let importedClass;
/** @type {LitElement} */
export let externalClass;

/** @type {LocalInterface} */
export let localInterface;
/** @type {ImportedInterface} */
export let importedInterface;

/** @type {string | number} */
export const testStringNumberUnion = 'hi';
/** @type {string | LocalClass} */
export const testStringClassUnion = 'hi';
/** @type {string | ImportedClass} */
export const testStringImportedClassUnion = 'hi';
/** @type {string | ImportedClass | HTMLElement} */
export const testStringImportedGlobalClassUnion = 'hi';

export const inferredLocalClass = new LocalClass();
export const inferredImportedClass = new ImportedClass();
export const inferredExternalClass = new LitElement();

/** @type {Promise<Map<keyof LitElement, ImportedClass[]>>[]} */
export let complexType;

export const {
  destructObj,
  foo: {destructObjNested},
} = {
  destructObj: new LocalClass(),
  foo: {destructObjNested: new LitElement()},
};

/** @type {LocalClass} */
const separatelyExportedClass = new LocalClass();
export {separatelyExportedClass};

const {
  separatelyExportedDestructObj,
  foo: {separatelyExportedDestructObjNested},
} = {
  separatelyExportedDestructObj: new LocalClass(),
  foo: {separatelyExportedDestructObjNested: new LitElement()},
};
export {separatelyExportedDestructObj, separatelyExportedDestructObjNested};

const [separatelyExportedDestructArr, [separatelyExportedDestructArrNested]] = [
  new LocalClass(),
  [new LitElement()],
];
export {separatelyExportedDestructArr, separatelyExportedDestructArrNested};

export const importedType = Math.random() ? returnsClass() : html``;
