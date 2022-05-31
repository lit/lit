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
          prop.typeString || 'string|undefined'
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
          event.typeString || `CustomEvent<unknown>`
        }) => void>()`
    )
    .join(',\n');

const renderEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${kabobToOnEvent(event.name)}: (event: ${
          event.typeString || `CustomEvent<unknown>`
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
