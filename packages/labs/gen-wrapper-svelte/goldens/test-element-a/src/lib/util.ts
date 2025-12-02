export function setProperties(
  node: HTMLElement,
  props: Record<string, unknown>
) {
  Object.entries(props).forEach(([key, value]) => {
    // @ts-expect-error - prop matches the key of the node
    node[key] = value;
  });
  return {
    update(props: Record<string, unknown>) {
      Object.entries(props).forEach(([key, value]) => {
        // @ts-expect-error - prop matches the key of the node
        node[key] = value;
      });
    },
  };
}
