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
} from '@lit-labs/analyzer/lib/model.js';
import {
  javascript,
  kabobToOnEvent,
  toInitialCap,
} from '@lit-labs/gen-utils/lib/str-utils.js';

/**
 * Generates a Vue wrapper component as a Typescript module. This approach
 * requires generating a Javascript property types object for Vue runtime
 * type checking to work.
 *
 * TODO(sorvell): This is currently unused and instead the wrapper is generated
 * as a Vue SFC. Need to decide which approach is best and delete the unused
 * generator.
 */
export const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  return javascript`
  import { h, defineComponent, openBlock, createBlock } from "vue";
  import { assignSlotNodes, Slots, eventProp } from "@lit-labs/vue-utils/wrapper-utils.js";
  import '${packageJson.name}/${moduleJsPath}';

  ${elements.map((element) => wrapperTemplate(element))}
`;
};

// TODO(sorvell): need to extract Javascript type from typescript for Vue.
// can workaround this by using an SFC and the macro `defineProperties<>()`
const tsTypeToVuePropType = (type: string) => {
  const required = type.indexOf('undefined') === -1;
  let jsType = type.replace('undefined', '').trim().replace(/[|]$/, '');
  jsType = jsType
    .split(/\s+/)
    .map((s) => toInitialCap(s).replace(/[|]/g, '||'))
    .join(' ')
    .trim();
  return `{type: ${jsType}, required: ${required}}`;
};

const wrapProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .map(
      (prop) =>
        `${prop.name}: ${tsTypeToVuePropType(
          prop.type?.text || 'string|undefined'
        )}`
    )
    .join(',\n');

// TODO(sorvell): Improve event handling, currently just forwarding the event,
// but this should be its "payload."
const wrapEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${kabobToOnEvent(event.name)}: eventProp<(event: ${
          event.type?.text || `CustomEvent<unknown>`
        }) => void>()`
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
        }) => emit(event.type, event.detail || event)`
    )
    .join(',\n');

// TODO(sorvell): Add support for `v-bind`.
const wrapperTemplate = ({
  name,
  tagname,
  events,
  reactiveProperties,
}: LitElementDeclaration) => {
  return javascript`
  const props = {
    ${wrapProps(reactiveProperties)},
    ${wrapEvents(events)}
  };

  const ${name} = defineComponent({
    name: "${name}",
    props,
    setup(props, {emit, slots}) {
      const render = () => h(
        "${tagname}",
        {
          ...props,
          ${renderEvents(events)}
        },
        assignSlotNodes(slots as Slots)
      );
      return () => {
        openBlock();
        return createBlock(render);
      };
    }
  });

  export default ${name};
`;
};
