import {h, PropType, VNode} from 'vue';

/**
 *
 * Utility for creating a typed event prop on a Vue component.
 * The property name should be `onPascalCase` and `T` here should be the
 * event function type signature.
 */
export const eventProp = <T>() => ({
  type: Function as PropType<T>,
  required: false,
});

/**
 * Vue has its own concept of slotting which is supported here. This is done so
 * that wrapper users have a first class framework experience and
 * because Vue previously used native syntax and therefore generates a
 * deprecation warning unless users turn off
 * `vue/no-deprecated-slot-attribute`.
 *
 * Slots are defined in Vue via `<template v-slot|#="slot-name">children</>`
 * and components have access to the slotted children and can manipulate them as
 * vNodes. The slots are iterated by name and the contained vNodes are given
 * slot attributes matching the name so they distribute correctly to native
 * Shadow DOM. When, vNodes represent text nodes or other Vue components, they
 * are wrapped in a `span` which is given the slot attribute.
 */
export type Slots = {[index: string]: () => VNode[]};

const isElementNode = (v: VNode) => typeof v.type === 'string';

const assignNode = (v: VNode, name: string) => {
  (v.props ??= {}).slot = name;
  return v;
};

// Wrap a given text node or component in a span with the given `slot`.
// If a component has 1 top level node and `inheritAttrs`
// has not been set to `false`, it's safe to `assignToSlot`; otherwise
// the component must be wrapped via `wrapToSlot`. It's not possible to see
// the component's vNodes from here so components always use `wrapToSlot`.
const assignWrappedNode = (v: VNode, name: string) =>
  h('span', {style: 'display: contents;', slot: name}, v);

// Converts Vue slot data to native slot-able nodes by directly manipulating
// vNodes.
export const assignSlotNodes = (slots: Slots) =>
  Object.keys(slots).map((name) =>
    slots[name]().map((v: VNode) =>
      name === 'default'
        ? v
        : isElementNode(v)
        ? assignNode(v, name)
        : assignWrappedNode(v, name)
    )
  );
