/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  LitElementDeclaration,
  ReactiveProperty as ModelProperty,
  Event as ModelEvent,
  PackageJson,
  getImportsStringForReferences,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, kabobToOnEvent} from '@lit-labs/gen-utils/lib/str-utils.js';

/**
 * Generates a Vue wrapper component as a Vue single file component. This
 * approach relies on the Vue compiler to generate a Javascript property types
 * object for Vue runtime type checking from the Typescript property types.
 *
 * TODO(sorvell): This is also a Typescript module generator that is unused.
 * Need to decide which approach is best and delete the unused generator.
 */
export const wrapperModuleTemplateSFC = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  const wcPath = `${packageJson.name}/${moduleJsPath}`;
  return elements.map((element) => [
    element.name!,
    wrapperTemplate(element, wcPath),
  ]);
};

// TODO(sorvell): place into model directly?
const getFieldModifierString = (node: ModelProperty['node']) =>
  node.questionToken ? '?' : node.exclamationToken ? '!' : '';

const getEventType = (event: ModelEvent) => event.type?.text || `unknown`;

const wrapDefineProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .map(
      (prop) =>
        `${prop.name}${getFieldModifierString(prop.node)}: ${prop.type?.text}`
    )
    .join(',\n');

// TODO(sorvell): Improve event handling, currently just forwarding the event,
// but this should be its "payload."
const wrapEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) => `(e: '${event.name}', payload: ${getEventType(event)}): void`
    )
    .join(',\n');
/**
 * Generates VNode props for events. Note that vue automatically maps
 * event names from e.g. `event-name` to `onEventName`.
 */
const renderEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${kabobToOnEvent(event.name)}: (event: ${
          event.type?.text || `CustomEvent<unknown>`
        }) => emit('${event.name}', (event.detail || event) as ${getEventType(
          event
        )})`
    )
    .join(',\n');

const getTypeReferencesForMap = (
  map: Map<string, ModelProperty | ModelEvent>
) => Array.from(map.values()).flatMap((e) => e.type?.references ?? []);

const getElementTypeImports = (declaration: LitElementDeclaration) => {
  const {events, reactiveProperties} = declaration;
  const refs = [
    ...getTypeReferencesForMap(events),
    ...getTypeReferencesForMap(reactiveProperties),
  ];
  return getImportsStringForReferences(refs);
};

// TODO(sorvell): Add support for `v-bind`.
const wrapperTemplate = (
  declaration: LitElementDeclaration,
  wcPath: string
) => {
  const {tagname, events, reactiveProperties} = declaration;
  return javascript`
    <script setup lang="ts">
      import { h, useSlots } from "vue";
      import { assignSlotNodes, Slots } from "@lit-labs/vue-utils/wrapper-utils.js";
      import '${wcPath}';
      ${getElementTypeImports(declaration)}

      ${
        reactiveProperties.size
          ? javascript`const props = defineProps<{
        ${wrapDefineProps(reactiveProperties)}
      }>();`
          : ''
      }

      ${
        events.size
          ? javascript`const emit = defineEmits<{
        ${wrapEvents(events)}
      }>();`
          : ''
      }

      const slots = useSlots();

      const render = () => h(
        '${tagname}',
        {
          ...props,
          ${renderEvents(events)}
        },
        assignSlotNodes(slots as Slots)
      );
    </script>
    <template><render /></template>`;
};
