import ts from 'typescript';
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

// TODO(sorvell): Need to process initializer into value
const getInitializerValue = (
  initializer: ModelProperty['node']['initializer']
) => {
  if (!initializer?.kind) {
    throw new Error('Property defaults must be specified with a literal.');
  }
  return initializer.kind === ts.SyntaxKind.StringLiteral
    ? `'${(initializer as ts.StringLiteral).text}'`
    : (initializer as ts.NumericLiteral)?.text;
};

const wrapDefineProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .map((prop) => `${prop.name}${getTypeToken(prop.node)}: ${prop.typeString}`)
    .join(',\n');

const wrapDefaultProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .filter((prop) => prop.node.initializer)
    .map(
      (prop) => `${prop.name}: ${getInitializerValue(prop.node.initializer!)}`
    )
    .join(',\n');

// TODO(sorvell): Improve event handling, currently just forwarding the event,
// but this should be its "payload."
const wrapEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `(e: '${event.name}', payload: ${event.typeString || `unknown`}): void`
    )
    .join(',\n');

const renderEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${kabobToOnEvent(event.name)}: (event: ${
          event.typeString || `CustomEvent<unknown>`
        }) => emit('${event.name}', (event.detail || event) as ${
          event.typeString || `unknown`
        })`
    )
    .join(',\n');

// TODO(sorvell): Add support for `v-bind`.
const wrapperTemplate = (
  {tagname, events, reactiveProperties}: LitElementDeclaration,
  wcPath: string
) => {
  return javascript`
    <script setup lang="ts">
      import { h, defineComponent, openBlock, createBlock } from "vue";
      import { wrapSlots, Slots, eventProp } from "@lit-labs/vue-utils/wrapper-utils.js";
      import '${wcPath}';

      const props = withDefaults(defineProps<{
        ${wrapDefineProps(reactiveProperties)}
      }>(), {${wrapDefaultProps(reactiveProperties)}});

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
        wrapSlots(slots as Slots)
      );
    </script>
    <template><render /></template>`;
};
