/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ImportedClass, ImportedInterface, returnsClass} from './external.js';
import {LitElement, html} from 'lit';

// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const testString: string = 'hi';
export const inferredString = 'hi';

export class LocalClass {}
export interface LocalInterface {
  someData: number;
}

export let localClass: LocalClass;
export let importedClass: ImportedClass;
export let externalClass: LitElement;

export let localInterface: LocalInterface;
export let importedInterface: ImportedInterface;

export const testStringNumberUnion: string | number = 'hi';
export const testStringClassUnion: string | LocalClass = 'hi';
export const testStringImportedClassUnion: string | ImportedClass = 'hi';
export const testStringImportedGlobalClassUnion:
  | string
  | ImportedClass
  | HTMLElement = 'hi';

export const inferredLocalClass = new LocalClass();
export const inferredImportedClass = new ImportedClass();
export const inferredExternalClass = new LitElement();

export let complexType: Promise<Map<keyof LitElement, ImportedClass[]>>[];

export const {
  destructObj,
  foo: {destructObjNested},
} = {
  destructObj: new LocalClass(),
  foo: {destructObjNested: new LitElement()},
};

const separatelyExportedClass: LocalClass = new LocalClass();
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

// The function type triggers a "Could not get symbol for 'T'." error.
// This is written as a nested object so that we can get the type of the
// function. Otherwise the function is analyzed as a FunctionDeclaration, which
// does not have a type in our model.
// The return type of the function must be *inferred* as a type parameter to
// trigger the error.
// TODO (justinfagnani): Add FunctionDeclaration type to the model and/or make
// FunctionDeclaration extend VariableDeclaration.
export const nestedTypeParameter = {
  f: <T>(o: T) => o,
};
