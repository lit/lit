/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getImportsStringForReferences,
  LitElementDeclaration,
  PackageJson,
} from '@oicl-lit/analyzer';

import {
  Event as EventModel,
  MixinDeclaration,
  NamedDescribed,
  ReactiveProperty as ModelProperty,
} from '@oicl-lit/analyzer/lib/model.js';
import {javascript, kabobToOnEvent} from '@oicl-lit/gen-utils/lib/str-utils.js';

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
  const handlers = Array.from(events.values())
    .map((event) => `'${event.name}': ${kabobToOnEvent(event.name)}`)
    .join(', ');
  return handlers ? `use:forwardEvents={{${handlers}}}` : '';
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

const getElementTypeImports = (
  events: Map<string, EventModel>,
  reactiveProperties: Map<string, ModelProperty>
) => {
  const refs = [
    ...getTypeReferencesForMap(events),
    ...getTypeReferencesForMap(reactiveProperties),
  ];
  return getImportsStringForReferences(refs).replace(
    /(?:^import)/gm,
    'import type'
  );
};

/**
 * Collects reactive properties inherited from superclasses and mixins so that
 * the generated wrapper exposes the full public API, not just properties
 * declared directly on the element class. Mirrors the Vue generator's
 * heritage resolution.
 */
const getHeritageReactiveProperties = (
  declaration: LitElementDeclaration
): Map<string, ModelProperty> => {
  const {heritage} = declaration;
  if (
    heritage == null ||
    (heritage.superClass?.name === 'LitElement' && heritage.mixins.length === 0)
  ) {
    return new Map();
  }
  const props: Array<[string, ModelProperty]> = heritage.mixins
    .map((mixin) => mixin.dereference(MixinDeclaration).classDeclaration)
    .filter((cls): cls is LitElementDeclaration =>
      cls.isLitElementDeclaration()
    )
    .flatMap((cls) => [
      ...cls.reactiveProperties.entries(),
      ...getHeritageReactiveProperties(cls).entries(),
    ]);
  if (heritage.superClass != null) {
    const superClass = heritage.superClass.dereference();
    if (superClass.isLitElementDeclaration()) {
      props.push(...superClass.reactiveProperties.entries());
      if (heritage.superClass.name !== 'LitElement') {
        props.push(...getHeritageReactiveProperties(superClass).entries());
      }
    }
  }
  return new Map(props);
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

const isDefaultSlot = (slot: NamedDescribed) =>
  slot.name === 'default' || slot.name === '' || slot.name === '-';

/**
 * The prop a parameterized slot loops over, matched by the text before the
 * first placeholder, optionally pluralized: `tab-<id>-icon` loops over `tabs`.
 */
const findCollectionProp = (
  slot: NamedDescribed,
  props: Map<string, ModelProperty>
) => {
  const prefix = slot.name.split('<')[0].replace(/-$/, '');
  return Array.from(props.values()).find(
    (p) =>
      p.name === prefix || p.name === prefix + 's' || p.name === prefix + 'es'
  );
};

/**
 * A parameterized slot whose names the element computes.
 *
 * The slot name without its placeholders names the list: for
 * `cell-<key>-<row>-icon` the element exposes `cellIconSlots`, one `{name}`
 * entry per slot, and documents a `cell-icon-slots-change` event. The wrapper
 * renders the snippet once per entry, so the names can depend on element state
 * and hold any number of placeholders. A matching collection prop wins, so a
 * slot that already loops over a prop keeps doing so.
 */
type SlotList = {
  /** Element property with the entries; also the wrapper's state variable. */
  property: string;
  event: string;
  itemType: string;
};

const getSlotList = (
  slot: NamedDescribed,
  props: Map<string, ModelProperty>,
  events: Map<string, EventModel>
): SlotList | undefined => {
  if (!slot.name.includes('<') || findCollectionProp(slot, props)) {
    return undefined;
  }
  const tokens = slot.name
    .replace(/<[^>]+>/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return undefined;
  const event = Array.from(events.values()).find(
    (e) => e.name === `${tokens.join('-')}-slots-change`
  );
  if (event === undefined) return undefined;
  return {
    property: `${slotNameToPropName(slot.name)}Slots`,
    event: event.name,
    itemType: event.type ? `${event.type.text}['detail'][number]` : 'any',
  };
};

const getSlotLists = (
  slots: Map<string, NamedDescribed>,
  props: Map<string, ModelProperty>,
  events: Map<string, EventModel>
) => {
  // Names that differ only in punctuation, such as `a-<x>` and `<x>-a`, map
  // to one list; declaring its state twice would not compile.
  const lists = new Map<string, SlotList>();
  for (const slot of slots.values()) {
    const list = getSlotList(slot, props, events);
    if (list && !lists.has(list.property)) lists.set(list.property, list);
  }
  return Array.from(lists.values());
};

const slotListSetter = (property: string) =>
  `set${property[0].toUpperCase()}${property.slice(1)}`;

// The setter lives in the script so the markup stays plain JavaScript.
const renderSlotListState = (slotLists: SlotList[]) =>
  slotLists
    .map(
      ({property, itemType}) =>
        `let ${property} = $state<${itemType}[]>([]);
      const ${slotListSetter(property)} = (slots: ${itemType}[]) => (${property} = slots);`
    )
    .join('\n      ');

const renderSlotListTracker = (slotLists: SlotList[]) =>
  slotLists.length === 0
    ? ''
    : `use:trackSlotLists={[${slotLists
        .map(
          ({property, event}) =>
            `{property: '${property}', event: '${event}', set: ${slotListSetter(property)}}`
        )
        .join(', ')}]}`;

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
    const snippetName = isDefaultSlot(slot)
      ? 'children'
      : slotNameToPropName(slot.name);
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
  props: Map<string, ModelProperty>,
  events: Map<string, EventModel>,
  namingPlan: NamingPlan
) => {
  const items = Array.from(slots.values()).map((slot) => {
    const propName =
      namingPlan.snippetNamesBySlotName.get(slot.name) ?? 'children';
    const slotList = getSlotList(slot, props, events);
    if (slotList) {
      return `${propName}?: Snippet<[${slotList.itemType}]>`;
    }
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
  events: Map<string, EventModel>,
  namingPlan: NamingPlan
) => {
  const parts = Array.from(slots.values()).map((slot) => {
    if (isDefaultSlot(slot)) {
      return javascript`
      {#if children}
        {@render children()}
      {/if}`;
    }
    const propName =
      namingPlan.snippetNamesBySlotName.get(slot.name) ?? 'children';
    const slotList = getSlotList(slot, props, events);
    if (slotList) {
      // Keyed by name so a slot keeps its rendered content when entries reorder.
      return javascript`
      {#if ${propName}}
        {#each ${slotList.property} as item (item.name)}
          <NamedSlot name={item.name} content={${propName}} arg={item} />
        {/each}
      {/if}`;
    }
    const placeholderMatch = slot.name.match(/<([^>]+)>/);
    if (placeholderMatch) {
      const placeholder = placeholderMatch[1];
      const collectionProp = findCollectionProp(slot, props);
      if (collectionProp) {
        const collectionName = collectionProp.name;
        return javascript`
      {#if props.${collectionName} && ${propName}}
        {#each props.${collectionName} as item}
          <NamedSlot name="${slot.name.replace(`<${placeholder}>`, `{item.${placeholder}}`)}" content={${propName}} arg={item} />
        {/each}
      {/if}`;
      }
    }

    return javascript`
      {#if ${propName}}
        <NamedSlot name="${slot.name}" content={${propName}} />
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
  const {tagname, events, slots} = declaration;
  // Merge inherited reactive properties (from superclasses and mixins) with
  // those declared directly on the element. Own properties take precedence.
  const reactiveProperties = new Map([
    ...getHeritageReactiveProperties(declaration),
    ...declaration.reactiveProperties,
  ]);
  const namingPlan = createNamingPlan(slots, reactiveProperties);
  const typeImports = getElementTypeImports(events, reactiveProperties);
  const typeExports = getElementTypeExportsFromImports(typeImports);
  const hasNamedSlots = Array.from(slots.values()).some(
    (slot) => !isDefaultSlot(slot)
  );
  const slotLists = getSlotLists(slots, reactiveProperties, events);
  return javascript`
  <script lang="ts">
    ${typeExports ?? ''}
      import '${wcPath}';
      import { setProperties${
        events.size > 0 ? ', forwardEvents' : ''
      }${slotLists.length > 0 ? ', trackSlotLists' : ''} } from "$lib/util.js";${
        hasNamedSlots
          ? '\n      import NamedSlot from "$lib/NamedSlot.svelte";'
          : ''
      }
      ${typeImports}
      import type { Snippet } from 'svelte';

      ${renderPropsInterface(reactiveProperties)}
      ${renderEventsInterface(events)}
      ${renderSlotsInterface(slots, reactiveProperties, events, namingPlan)}
      const {${renderEventsProps(events)} class: className, style, ${renderSlotsDestructureList(slots, namingPlan)}, ...props} = $props<Props & Events & Slots>();
      ${renderSlotListState(slotLists)}

    </script>
    <${tagname}
    use:setProperties={props}
    ${renderSlotListTracker(slotLists)}
    class={className}
    style={style}
    ${renderEventsMapper(events)} >
      ${renderSnippets(slots, reactiveProperties, events, namingPlan)}
    </${tagname}>`;
};
