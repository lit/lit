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

const nameToSvelteName = (name: string) => {
  return name
    .replace(/_[a-z]/g, (match) => match.toUpperCase()[1])
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/Æ/g, 'Ae')
    .replace(/Ø/g, 'Oe')
    .replace(/Å/g, 'Aa');
};

const isValidSvelteName = (name: string) => {
  return !/[_æøåÆØÅ]/.test(name);
};

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
  return elements
    .filter((element) => isValidSvelteName(element.name!))
    .map((element) => {
      return [
        nameToSvelteName(element.name!),
        wrapperTemplate(element, wcPath),
      ];
    });
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
     class?: string;
     style?: string;
     ${Array.from(props.values())
       .map((prop) => {
         // @ts-expect-error - jsDoc is not typed
         const comment = prop.node.jsDoc?.map((doc) => doc.comment).join(' ');
         const description = comment ? ` /** ${comment} */\n` : '';
         return `${description}${prop.name}?: ${prop.type?.text || 'any'}`;
       })
       .join(';\n     ')}
   }`;

const renderEventsInterface = (events: Map<string, EventModel>) =>
  `export interface Events {
    ${Array.from(events.values())
      .map((event) => {
        const {type} = getEventInfo(event);
        return `${kabobToOnEvent(event.name)}?: (event: ${type}) => void`;
      })
      .join(';\n    ')}
  }`;

export const renderEventsMapper = (events: Map<string, EventModel>) => {
  return Array.from(events.values())
    .map((event) => {
      const {name} = event;
      return `on${name}={${kabobToOnEvent(name)}}`;
    })
    .join('\n   ');
};

export const renderPropsMapper = (props: Map<string, ModelProperty>) => {
  return (
    'class={props.class}\n   style={props.style}\n   ' +
    Array.from(props.values())
      .map((prop) => {
        const {name} = prop;
        let defaultValue = '';
        if (prop.default !== undefined) {
          defaultValue = ` ?? ${prop.default}`;
        }
        return `${name}={props.${name}${defaultValue}}`;
      })
      .join('\n   ')
  );
};

const getTypeReferencesForMap = (
  map: Map<string, ModelProperty | EventModel>
) => Array.from(map.values()).flatMap((e) => e.type?.references ?? []);

const getElementTypeImports = (declaration: LitElementDeclaration) => {
  const {events, reactiveProperties} = declaration;
  const refs = [
    ...getTypeReferencesForMap(events),
    ...getTypeReferencesForMap(reactiveProperties),
  ];
  return getImportsStringForReferences(refs).replace(
    /(?:^import)/gm,
    'import type'
  );
};

// TODO(sorvell): add support for getting exports in analyzer.
const getElementTypeExportsFromImports = (imports: string) =>
  imports.replace(/(?:^import)/gm, 'export');

const slotNameToPropName = (name: string) =>
  name
    .trim()
    .replace(/^-+$/, 'default')
    .replace(/^(default|children)$/i, 'children')
    .replace(/-([a-zA-Z])/g, (_m, c) => c.toUpperCase());

const renderSlotsInterface = (slots: Map<string, NamedDescribed>) => {
  const items = Array.from(slots.values()).map((slot) => {
    const isDefault =
      slot.name === 'default' || slot.name === '' || slot.name === '-';
    const propName = isDefault ? 'children' : slotNameToPropName(slot.name);
    return `${propName}?: Snippet`;
  });
  // Always support a default snippet even if analyzer didn't declare slots
  if (items.length === 0) {
    items.push('children?: Snippet');
  }
  return `export interface Slots {\n  ${items.join(';\n  ')}\n}`;
};

const renderSlotsDestructureList = (slots: Map<string, NamedDescribed>) => {
  const names = Array.from(slots.values()).map((slot) => {
    const isDefault =
      slot.name === 'default' || slot.name === '' || slot.name === '-';
    return isDefault ? 'children' : slotNameToPropName(slot.name);
  });
  if (names.length === 0) {
    names.push('children');
  }
  return names.join(', ');
};

const renderSnippets = (slots: Map<string, NamedDescribed>) => {
  const parts = Array.from(slots.values()).map((slot) => {
    const isDefault =
      slot.name === 'default' || slot.name === '' || slot.name === '-';
    if (isDefault) {
      return javascript`{@render children?.()}`;
    }
    const propName = slotNameToPropName(slot.name);
    // Use fragment with slot attribute so content projects into named slot of the web component
    return javascript`<svelte:fragment slot="${slot.name}">{@render ${propName}?.()}</svelte:fragment>`;
  });
  if (parts.length === 0) {
    parts.push(javascript`{@render children?.()}`);
  }
  return parts.join('\n');
};

const renderEventsProps = (events: Map<string, EventModel>) => {
  const eventsProps = Array.from(events.keys())
    .map((event) => kabobToOnEvent(event))
    .join(', ');
  return eventsProps ? `${eventsProps},` : '';
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
      import { setProperties } from "$lib/util.js";
      ${typeImports}
      import type { Snippet } from 'svelte';

      ${renderPropsInterface(reactiveProperties)}
      ${renderEventsInterface(events)}
      ${renderSlotsInterface(slots)}
      const {${renderEventsProps(events)} class: className, style, ${renderSlotsDestructureList(slots)}, ...props} = $props<Props & Events & Slots>();

    </script>
    <${tagname}
    use:setProperties={props}
    class={className}
    style={style}
    ${renderEventsMapper(events)} >
      ${renderSnippets(slots)}
    </${tagname}>`;
};
