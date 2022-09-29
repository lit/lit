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
  Event as ModelEvent,
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

const getEventType = (event: ModelEvent) => event.type?.text || `unknown`;

const renderPropsInterface = (props: Map<string, ModelProperty>) =>
  `export interface Props {
     ${Array.from(props.values())
       .map((prop) => `${prop.name}?: ${prop.type?.text || 'any'}`)
       .join(';\n     ')}
   }`;

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
  javascript`{
    ${Array.from(events.values())
      .map(
        (event) =>
          `${kabobToOnEvent(event.name)}: (event: ${
            event.type?.text || `CustomEvent<unknown>`
          }) => emit('${event.name}', (event.detail || event) as ${getEventType(
            event
          )})`
      )
      .join(',\n')}
  }`;

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
      import { h, useSlots, reactive } from "vue";
      import { assignSlotNodes, Slots } from "@lit-labs/vue-utils/wrapper-utils.js";
      import '${wcPath}';
      ${getElementTypeImports(declaration)}

      ${renderPropsInterface(reactiveProperties)}

      const vueProps = defineProps<Props>();

      const defaults = reactive({} as Props);
      const vDefaults = {
        created(el: any) {
          for (const p in vueProps) {
            defaults[p as keyof Props] = el[p];
          }
        }
      };

      let hasRendered = false;

      ${
        events.size
          ? javascript`const emit = defineEmits<{
        ${wrapEvents(events)}
      }>();`
          : ''
      }

      const slots = useSlots();

      const render = () => {
        const eventProps = ${renderEvents(events)};

        const props = eventProps as (typeof eventProps & Props);
        for (const p in vueProps) {
          const v = vueProps[p as keyof Props];
          if ((v !== undefined) || hasRendered) {
            props[p as keyof Props] = v ?? defaults[p as keyof Props];
          }
        }

        hasRendered = true;

        return h(
          '${tagname}',
          props,
          assignSlotNodes(slots as Slots)
        );
      };
    </script>
    <template><render v-defaults /></template>`;
};
