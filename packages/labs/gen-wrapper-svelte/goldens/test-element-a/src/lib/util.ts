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
