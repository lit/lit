export interface SlotList {
  /** Element property holding the current `{name}` entries. */
  property: string;
  /** Event the element fires when the entries change. */
  event: string;
  // Method syntax keeps the parameter bivariant, so a setter typed with the
  // element's own entry type is accepted.
  set(slots: { name: string }[]): void;
}

/**
 * Mirrors slot lists the element computes into wrapper state. Each list is
 * read on mount, since the element may have rendered first, and again on
 * every change event.
 */
export function trackSlotLists(node: HTMLElement, lists: SlotList[]) {
  let current = lists;
  const read = (index: number) => {
    const slots = (node as unknown as Record<string, unknown>)[
      current[index].property
    ];
    current[index].set(Array.isArray(slots) ? [...slots] : []);
  };
  const listeners = lists.map((list, index) => {
    const listener = () => read(index);
    node.addEventListener(list.event, listener);
    read(index);
    return listener;
  });
  return {
    update(lists: SlotList[]) {
      current = lists;
    },
    destroy() {
      lists.forEach((list, index) =>
        node.removeEventListener(list.event, listeners[index]),
      );
    },
  };
}

const ignoreProps = ["class", "style", "$$slots", "children"];

function updateProperty(node: HTMLElement, props: Record<string, unknown>) {
  Object.entries(props)
    .filter(([key]) => !ignoreProps.includes(key))
    .forEach(([key, value]) => {
      try {
        // @ts-expect-error - prop matches the key of the node
        node[key] = value;
      } catch (error) {
        console.warn(`Error setting property ${key} on node: ${error}`);
      }
    });
}

export function setProperties(
  node: HTMLElement,
  props: Record<string, unknown>,
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

/**
 * `slot` value of the markers that delimit a NamedSlot region. It matches no
 * real slot, so the markers stay unassigned and never affect layout.
 */
export const SLOT_MARKER = "svelte-slot-marker";

export interface AssignSlotOptions {
  name: string;
  /** Called when the region renders text, which cannot carry a `slot`. */
  onText: () => void;
}

const isMarker = (node: Node) =>
  node instanceof HTMLTemplateElement && node.slot === SLOT_MARKER;

/**
 * Assigns the elements rendered between this start marker and the next marker
 * to a named slot by setting their `slot` attribute, so they slot natively
 * like the web component's documented usage. Nodes are never moved: Svelte
 * removes blocks by walking their sibling range.
 */
export function assignSlot(
  start: HTMLTemplateElement,
  options: AssignSlotOptions,
) {
  let current = options;
  const assign = () => {
    for (
      let node = start.nextSibling;
      node && !isMarker(node);
      node = node.nextSibling
    ) {
      if (node instanceof Element) {
        if (node.slot !== current.name) node.slot = current.name;
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        current.onText();
        return;
      }
    }
  };
  assign();
  // Re-assign when the snippet's top-level nodes change, e.g. an `{#if}` at
  // the snippet root. Mutation records are delivered before the next paint.
  const observer = new MutationObserver(assign);
  if (start.parentNode) observer.observe(start.parentNode, { childList: true });
  return {
    update(options: AssignSlotOptions) {
      current = options;
      assign();
    },
    destroy() {
      observer.disconnect();
    },
  };
}
