import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

export const utilTemplate = () => javascript`
export function setProperties(node: HTMLElement, props: Record<string, unknown>) {
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
    }
  };
}
`;
