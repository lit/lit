import {h, defineComponent, openBlock, createBlock} from 'vue';
import {
  wrapSlots,
  Slots,
  eventProp,
} from '@lit-labs/vue-utils/wrapper-utils.js';
import '@lit-internal/test-element-a/element-a.js';

const props = {
  foo: {type: String, required: false},
  onAChanged: eventProp<(event: CustomEvent<unknown>) => void>(),
};

const ElementA = defineComponent({
  name: 'ElementA',
  props,
  setup(props, {emit, slots}) {
    const render = () =>
      h(
        'element-a',
        {
          ...props,
          onAChanged: (event: CustomEvent<unknown>) =>
            emit(event.type, event.detail || event),
        },
        wrapSlots(slots as Slots)
      );
    return () => {
      openBlock();
      return createBlock(render);
    };
  },
});

export default ElementA;
