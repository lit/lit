import {
  LitElementDeclaration,
  ReactiveProperty as ModelProperty,
  Event as ModelEvent,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, kabobToOnEvent} from '@lit-labs/gen-utils/lib/str-utils.js';

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
const getTypeToken = (node: ModelProperty['node']) =>
  node.questionToken ? '?' : node.exclamationToken ? '!' : '';

const getEventType = (event: ModelEvent) => event.typeString || `unknown`;

const wrapDefineProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .map((prop) => `${prop.name}${getTypeToken(prop.node)}: ${prop.typeString}`)
    .join(',\n');

// TODO(sorvell): Improve event handling, currently just forwarding the event,
// but this should be its "payload."
const wrapEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) => `(e: '${event.name}', payload: ${getEventType(event)}): void`
    )
    .join(',\n');

const renderEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${kabobToOnEvent(event.name)}: (event: ${
          event.typeString || `CustomEvent<unknown>`
        }) => emit('${event.name}', (event.detail || event) as ${getEventType(
          event
        )})`
    )
    .join(',\n');

// TODO(sorvell): Add support for `v-bind`.
const wrapperTemplate = (
  {tagname, events, reactiveProperties}: LitElementDeclaration,
  wcPath: string
) => {
  return javascript`
    <script setup lang="ts">
      import { h, useSlots } from "vue";
      import { assignSlotNodes, Slots } from "@lit-labs/vue-utils/wrapper-utils.js";
      import '${wcPath}';

      const props = defineProps<{
        ${wrapDefineProps(reactiveProperties)}
      }>();

      const emit = defineEmits<{
        ${wrapEvents(events)}
      }>()

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
