/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LitElementDeclaration,
  PackageJson,
  getImportsStringForReferences,
} from '@lit-labs/analyzer';

import {
  ReactiveProperty as ModelProperty,
  Event as EventModel,
  NamedDescribed,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, kabobToOnEvent} from '@lit-labs/gen-utils/lib/str-utils.js';

/**
 * Generates a Svelte wrapper component as a Svelte single file component. This
 * approach relies on the Svelte compiler to generate a JavaScript property types
 * object for Svelte runtime type checking from the Typescript property types.
 */
export const wrapperModuleTemplateSFC = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  moduleJsPath = moduleJsPath.replace(/\\/g, '/');
  const wcPath = `${packageJson.name}/${moduleJsPath}`;
  return elements.map((element) => [
    element.name!,
    wrapperTemplate(element, wcPath),
  ]);
};

const defaultEventType = `CustomEvent<unknown>`;

const getEventInfo = (event: EventModel) => {
  const {name, type: modelType} = event;
  const onName = kabobToOnEvent(name);
  const type = modelType?.text ?? defaultEventType;
  return {onName, type};
};

const renderPropsInterface = (props: Map<string, ModelProperty>) =>
  `export interface Props {
     ${Array.from(props.values())
       .map((prop) => `${prop.name}?: ${prop.type?.text || 'any'}`)
       .join(';\n     ')}
   }`;

const dashToCamel = (name: string) =>
  name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
const renderEventsInterface = (events: Map<string, EventModel>) =>
  `export interface Events {
    ${Array.from(events.values())
      .map((event) => {
        const {type} = getEventInfo(event);
        return `${dashToCamel(event.name)}: (event: ${type}) => void`;
      })
      .join(';\n    ')}
  }`;

const getTypeReferencesForMap = (
  map: Map<string, ModelProperty | EventModel>
) => Array.from(map.values()).flatMap((e) => e.type?.references ?? []);

const getElementTypeImports = (declaration: LitElementDeclaration) => {
  const {events, reactiveProperties} = declaration;
  const refs = [
    ...getTypeReferencesForMap(events),
    ...getTypeReferencesForMap(reactiveProperties),
  ];
  return getImportsStringForReferences(refs);
};

// TODO(sorvell): add support for getting exports in analyzer.
const getElementTypeExportsFromImports = (imports: string) =>
  imports.replace(/(?:^import)/gm, 'export type');

const renderSlots = (slots: Map<string, NamedDescribed>) => {
  return Array.from(slots.values())
    .map((slot) => {
      if (slot.name === 'default') {
        return javascript`
        <slot />
      `;
      }
      return javascript`
      <slot name="${slot.name}" />
    `;
    })
    .join('\n');
};

const wrapperTemplate = (
  declaration: LitElementDeclaration,
  wcPath: string
) => {
  const {tagname, events, reactiveProperties, slots} = declaration;
  const typeImports = getElementTypeImports(declaration);
  const typeExports = getElementTypeExportsFromImports(typeImports);
  return javascript`
  <script lang="ts">
    ${typeExports ?? ''}
      import '${wcPath}';
      ${typeImports}
      
      ${renderPropsInterface(reactiveProperties)}
      ${renderEventsInterface(events)}
      const props = $props<{...Props, ...Events}>();

    </script>
    <${tagname} {...props} >
      ${renderSlots(slots)}
    </${tagname}>`;
};
