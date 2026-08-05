import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

export const utilTemplate = () => javascript`

const ignoreProps = ["class", "style", "$$slots", "children"];

function updateProperty(node: HTMLElement, props: Record<string, unknown>) {
  Object.entries(props)
    .filter(([key]) => !ignoreProps.includes(key))
    .forEach(([key, value]) => {
      try {
        // @ts-expect-error - prop matches the key of the node
        node[key] = value;
      } catch (error) {
        console.warn(\`Error setting property \${key} on node: \${error}\`);
      }
    });
}

export function setProperties(
  node: HTMLElement,
  props: Record<string, unknown>
) {
  updateProperty(node, props);
  return {
    update(props: Record<string, unknown>) {
      updateProperty(node, props);
    },
  };
}

type EventHandlers = Record<string, ((event: Event) => void) | undefined>;

export function forwardEvents(node: HTMLElement, handlers: EventHandlers) {
  let current = handlers;
  const listeners = new Map<string, (event: Event) => void>();
  for (const name of Object.keys(handlers)) {
    const listener = (event: Event) => current[name]?.(event);
    listeners.set(name, listener);
    node.addEventListener(name, listener);
  }
  return {
    update(handlers: EventHandlers) {
      current = handlers;
    },
    destroy() {
      for (const [name, listener] of listeners) {
        node.removeEventListener(name, listener);
      }
    },
  };
}

`;
