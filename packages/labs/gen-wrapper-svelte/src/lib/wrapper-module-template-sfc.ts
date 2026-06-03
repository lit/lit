/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getImportsStringForReferences,
  LitElementDeclaration,
  PackageJson,
} from '@lit-labs/analyzer';

import {
  Event as EventModel,
  NamedDescribed,
  ReactiveProperty as ModelProperty,
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

const slotNameToPropName = (name: string) => {
  // Normalize and map slot names to safe Svelte identifiers
  // Rules:
  // - default/children/"-" map to `children`
  // - Convert sequences of non-alphanumeric chars into camelCase
  // - Remove remaining non-alphanumerics
  const trimmed = name.trim();
  if (/^-+$/.test(trimmed)) return 'children';
  if (/^(default|children)$/i.test(trimmed)) return 'children';
  // If the name contains a placeholder like <id>, we clean it up but keep the rest
  // to form a property name for the parameterized snippet.
  // e.g. tab-<id>-icon -> tabIcon
  const cleanName = trimmed.replace(/<[^>]+>/g, '');
  // Build camelCase tokenizing on any non-alphanumeric sequence
  return cleanName
    .split(/[^a-zA-Z0-9]+/)
    .filter((t) => t.length > 0)
    .map((t, i) => (i === 0 ? t : t[0].toUpperCase() + t.slice(1)))
    .join('');
};

type NamingPlan = {
  snippetNamesBySlotName: Map<string, string>;
};

const createNamingPlan = (
  slots: Map<string, NamedDescribed>,
  props: Map<string, ModelProperty>
): NamingPlan => {
  const propNames = new Set(
    Array.from(props.values()).map((prop) => prop.name)
  );
  const snippetNamesBySlotName = new Map<string, string>();
  const collidingPropNames = new Set<string>();

  for (const slot of slots.values()) {
    const isDefault =
      slot.name === 'default' || slot.name === '' || slot.name === '-';
    const snippetName = isDefault ? 'children' : slotNameToPropName(slot.name);
    snippetNamesBySlotName.set(slot.name, snippetName);
    if (propNames.has(snippetName)) {
      collidingPropNames.add(snippetName);
    }
  }

  for (const [slotName, snippetName] of snippetNamesBySlotName) {
    if (collidingPropNames.has(snippetName)) {
      snippetNamesBySlotName.set(slotName, `${snippetName}Snippet`);
    }
  }

  return {
    snippetNamesBySlotName,
  };
};

const renderSlotsInterface = (
  slots: Map<string, NamedDescribed>,
  namingPlan: NamingPlan
) => {
  const items = Array.from(slots.values()).map((slot) => {
    const propName =
      namingPlan.snippetNamesBySlotName.get(slot.name) ?? 'children';
    const isDynamic = slot.name.includes('<');
    return `${propName}?: Snippet${isDynamic ? '<[any]>' : ''}`;
  });
  // Always support a default snippet even if analyzer didn't declare slots
  if (items.length === 0) {
    items.push('children?: Snippet');
  }
  return `export interface Slots {\n  ${items.join(';\n  ')}\n}`;
};

const renderSlotsDestructureList = (
  slots: Map<string, NamedDescribed>,
  namingPlan: NamingPlan
) => {
  const names = Array.from(slots.values()).map(
    (slot) => namingPlan.snippetNamesBySlotName.get(slot.name) ?? 'children'
  );
  if (names.length === 0) {
    names.push('children');
  }
  return names.join(', ');
};

const renderSnippets = (
  slots: Map<string, NamedDescribed>,
  props: Map<string, ModelProperty>,
  namingPlan: NamingPlan
) => {
  const parts = Array.from(slots.values()).map((slot) => {
    const isDefault =
      slot.name === 'default' || slot.name === '' || slot.name === '-';
    if (isDefault) {
      return javascript`
      {#if children}
        {@render children()}
      {/if}`;
    }
    const propName =
      namingPlan.snippetNamesBySlotName.get(slot.name) ?? 'children';
    const placeholderMatch = slot.name.match(/<([^>]+)>/);
    if (placeholderMatch) {
      const placeholder = placeholderMatch[1];
      // Try to find a property that is likely the collection for this slot.
      // Heuristic: property name starts with the prefix of the slot name.
      const prefix = slot.name.split('<')[0].replace(/-$/, '');
      const collectionProp = Array.from(props.values()).find(
        (p) =>
          p.name === prefix ||
          p.name === prefix + 's' ||
          p.name === prefix + 'es'
      );
      if (collectionProp) {
        const collectionName = collectionProp.name;
        return javascript`
      {#if props.${collectionName} && ${propName}}
        {#each props.${collectionName} as item}
          <div slot="${slot.name.replace(`<${placeholder}>`, `{item.${placeholder}}`)}">
            {@render ${propName}(item)}
          </div>
        {/each}
      {/if}`;
      }
    }

    // Use div with slot attribute and display: contents so content projects into named slot of the web component
    return javascript`
      {#if ${propName}}
        <div slot="${slot.name}">
          {@render ${propName}()}
        </div>
      {/if}`;
  });
  if (parts.length === 0) {
    parts.push(javascript`
    {#if children}
      {@render children()}
    {/if}`);
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
  const namingPlan = createNamingPlan(slots, reactiveProperties);
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
      ${renderSlotsInterface(slots, namingPlan)}
      const {${renderEventsProps(events)} class: className, style, ${renderSlotsDestructureList(slots, namingPlan)}, ...props} = $props<Props & Events & Slots>();

    </script>
    <${tagname}
    use:setProperties={props}
    class={className}
    style={style}
    ${renderEventsMapper(events)} >
      ${renderSnippets(slots, reactiveProperties, namingPlan)}
    </${tagname}>`;
};
